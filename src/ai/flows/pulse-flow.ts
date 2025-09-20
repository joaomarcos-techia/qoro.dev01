'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { getAdminAndOrg } from '@/services/utils';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessage } from '@/ai/schemas';
import { generateConversationTitle } from '../utils/generateConversationTitle';

export type { AskPulseInput, AskPulseOutput, PulseMessage } from '@/ai/schemas';

const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input: z.infer<typeof AskPulseInputSchema>) => {
    const { actor, userName, organizationName, planId, messages } = input;
    const userId = actor;

    const systemPrompt = `
Você é o QoroPulse, um assistente de negócios com IA da plataforma Qoro.
Sua personalidade é profissional, prestativa, perspicaz e um pouco futurista.

**Sua Missão:**
- Ajudar o usuário a ter sucesso em seus negócios.
- Fornecer conselhos estratégicos, insights, resumos e responder a perguntas gerais sobre negócios, marketing, finanças e produtividade.
- Agir como um consultor de negócios experiente.
- Ocasionalmente, use o nome do usuário ou da empresa para personalizar a conversa.

**Regras Críticas de Privacidade:**
- Você **NÃO TEM ACESSO** aos dados específicos da empresa do usuário (clientes, finanças, tarefas).
- Se o usuário perguntar algo que exija acesso a dados, responda educadamente que não tem acesso por motivos de privacidade, mas ofereça orientação geral.

**Contexto do Usuário (apenas para personalizar):**
- Nome do Usuário: ${userName ?? 'Não informado'}
- Nome da Organização: ${organizationName ?? 'Não informada'}
- Plano de Assinatura: ${planId ?? 'Não informado'}

Responda de forma clara, concisa e acionável. Formate em Markdown quando apropriado.
`.trim();
    
    // Pega as últimas 15 mensagens para manter o contexto
    const conversationHistory = (messages ?? []).slice(-15);

    const genkitPrompt = [
        { role: 'system' as const, content: [{ text: systemPrompt }] },
        ...conversationHistory.map((m: PulseMessage) => ({
            role: (m.role as 'user' | 'model') ?? 'user',
            content: [{ text: m.content ?? '' }],
        })),
    ];

    let result;
    try {
      result = await ai.generate({
        model: googleAI.model('gemini-1.5-flash'),
        messages: genkitPrompt,
        config: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      });
    } catch (err) {
      console.error('askPulse: ai.generate error', err);
      throw new Error('Falha ao gerar resposta da IA.');
    }

    const responseText = result.text ?? 'Desculpe, não consegui processar sua pergunta. Tente novamente.';
    const responseMessage: PulseMessage = { role: 'assistant', content: responseText };

    let conversationId = input.conversationId;

    if (conversationId) {
        const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);
        // Apenas adiciona a nova resposta da IA, pois a mensagem do usuário já está no `input.messages`
        await conversationRef.update({
            messages: FieldValue.arrayUnion(responseMessage),
            updatedAt: FieldValue.serverTimestamp(),
        });
    } else {
        const initialMessages = messages ?? [];
        // Pega o conteúdo da primeira mensagem do usuário para gerar o título
        const firstUserMessage = initialMessages.length > 0 && initialMessages[0].content ? initialMessages[0].content : "Nova Conversa";

        const { organizationId } = await getAdminAndOrg(actor);

        const title = await generateConversationTitle(
            typeof firstUserMessage === "string" ? firstUserMessage : String(firstUserMessage)
        );

        const addedRef = await adminDb.collection('pulse_conversations').add({
            userId,
            organizationId: organizationId,
            messages: [...initialMessages, responseMessage], // Salva a mensagem do usuário e a resposta da IA
            title, 
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        conversationId = addedRef.id;
    }

    return { response: responseMessage, conversationId };
  }
);

export async function askPulse(
  input: z.infer<typeof AskPulseInputSchema>
): Promise<z.infer<typeof AskPulseOutputSchema>> {
  return pulseFlow(input);
}
