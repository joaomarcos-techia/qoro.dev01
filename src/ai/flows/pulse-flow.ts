
'use server';
/**
 * @fileOverview A conversational AI flow for QoroPulse.
 * This flow provides business advice and answers general questions without
 * accessing specific user data, ensuring privacy.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminAndOrg } from '@/services/utils';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessage } from '@/ai/schemas';

// Re-export types for use in other server components if needed.
export type { AskPulseInput, AskPulseOutput, PulseMessage } from '@/ai/schemas';

// Define the main Pulse flow
const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input) => {
    const { organizationName, userData, planId } = await getAdminAndOrg(input.actor);
    const userId = input.actor; // The actor is the userId

    const systemPrompt = `
      Você é o QoroPulse, um assistente de negócios com IA da plataforma Qoro.
      Sua personalidade é profissional, prestativa, perspicaz e um pouco futurista.

      **Sua Missão:**
      - Ajudar o usuário a ter sucesso em seus negócios.
      - Fornecer conselhos estratégicos, insights, resumos e responder a perguntas gerais sobre negócios, marketing, finanças e produtividade.
      - Agir como um consultor de negócios experiente.

      **Regras Críticas de Privacidade:**
      - Você **NÃO TEM ACESSO** aos dados específicos da empresa do usuário (clientes, finanças, tarefas).
      - Se o usuário perguntar algo que exija acesso a dados (ex: "Quantos clientes eu tenho?", "Qual foi meu faturamento?"), você deve responder de forma educada que não tem acesso a essas informações por motivos de privacidade e segurança, mas que pode oferecer conselhos gerais sobre o tema.
      - Exemplo de resposta para dados específicos: "Por razões de segurança e privacidade, eu não tenho acesso direto aos dados da sua empresa, como a lista de clientes. No entanto, posso te dar dicas de como analisar sua base de clientes para extrair mais valor."

      **Contexto do Usuário (NÃO são dados da empresa, apenas para personalizar a conversa):**
      - Nome do Usuário: ${userData.name || 'Não informado'}
      - Nome da Organização: ${organizationName || 'Não informada'}
      - Plano de Assinatura: ${planId}

      Responda à pergunta do usuário com base no histórico da conversa e em seu conhecimento geral de negócios. Seja claro, conciso e acionável. Use markdown para formatar suas respostas quando apropriado (listas, negrito, etc.).
    `;

    const { output } = await ai.generate({
      model: 'gemini-1.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...input.messages.map(h => ({ role: h.role, content: h.content })),
      ],
    });
    
    const responseText = output?.text ?? "Desculpe, não consegui processar sua pergunta. Tente novamente.";
    const responseMessage: PulseMessage = { role: 'assistant', content: responseText };

    // Determine if we're creating a new conversation or updating an existing one
    let conversationId = input.conversationId;
    let conversationRef;

    if (conversationId) {
      conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);
      // Append only the latest user message and the new model response
      const latestUserMessage = input.messages[input.messages.length - 1];
      await conversationRef.update({
        messages: FieldValue.arrayUnion(latestUserMessage, responseMessage),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
       const initialMessages = input.messages;
       const firstUserMessage = initialMessages[0];
       
       conversationRef = await adminDb.collection('pulse_conversations').add({
        userId,
        messages: [...initialMessages, responseMessage],
        title: firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? '...' : ''),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      conversationId = conversationRef.id;
    }

    return { response: responseMessage, conversationId };
  }
);

// Exported wrapper function for client-side use
export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<z.infer<typeof AskPulseOutputSchema>> {
  return pulseFlow(input);
}
