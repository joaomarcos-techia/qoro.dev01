// src/ai/flows/pulse-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminAndOrg } from '@/services/utils';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessage } from '@/ai/schemas';

export type { AskPulseInput, AskPulseOutput, PulseMessage } from '@/ai/schemas';

const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input) => {
    const { organizationName, userData, planId } = await getAdminAndOrg(input.actor);
    const userId = input.actor;

    const systemPrompt = `
Você é o QoroPulse, um assistente de negócios com IA da plataforma Qoro.
Sua personalidade é profissional, prestativa, perspicaz e um pouco futurista.

**Sua Missão:**
- Ajudar o usuário a ter sucesso em seus negócios.
- Fornecer conselhos estratégicos, insights, resumos e responder a perguntas gerais sobre negócios, marketing, finanças e produtividade.
- Agir como um consultor de negócios experiente.

**Regras Críticas de Privacidade:**
- Você **NÃO TEM ACESSO** aos dados específicos da empresa do usuário (clientes, finanças, tarefas).
- Se o usuário perguntar algo que exija acesso a dados, responda educadamente que não tem acesso por motivos de privacidade, mas ofereça orientação geral.

**Contexto do Usuário (apenas para personalizar):**
- Nome do Usuário: ${userData?.name ?? 'Não informado'}
- Nome da Organização: ${organizationName ?? 'Não informada'}
- Plano de Assinatura: ${planId ?? 'Não informado'}

Responda de forma clara, concisa e acionável. Formate em Markdown quando apropriado.
`.trim();

    const genkitMessages = [
      { role: 'system', content: [{ text: systemPrompt }] },
      ...(input.messages ?? []).map((m) => ({
        role: (m.role as 'user' | 'assistant' | 'tool' | 'model') ?? 'user',
        content: [{ text: m.content ?? '' }],
      })),
    ];

    let rawResponse: any = null;
    try {
      rawResponse = await ai.generate({
        model: 'gemini-1.5-flash',
        messages: genkitMessages,
        temperature: 0.3,
        maxOutputTokens: 1024,
      });
    } catch (err) {
      console.error('askPulse: ai.generate error', err);
    }

    let responseText = 'Desculpe, não consegui processar sua pergunta. Tente novamente.';
    if (rawResponse) {
      // Handle both v1.x (rawResponse.text) and potential older structures
      if (typeof rawResponse.text === 'string') {
        responseText = rawResponse.text;
      } else if (
        rawResponse.output &&
        Array.isArray(rawResponse.output) &&
        rawResponse.output[0]?.content?.[0]?.text
      ) {
        responseText = rawResponse.output[0].content[0].text;
      }
    }

    const responseMessage: PulseMessage = { role: 'assistant', content: responseText };

    let conversationId = input.conversationId;
    let conversationRef: FirebaseFirestore.DocumentReference | undefined;

    if (conversationId) {
      conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);
      const latestUserMessage = input.messages[input.messages.length - 1];
      await conversationRef.update({
        messages: FieldValue.arrayUnion(latestUserMessage, responseMessage),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const initialMessages = input.messages ?? [];
      const firstUserMessage = initialMessages[0] ?? { content: 'Sem conteúdo', role: 'user' };
      const addedRef = await adminDb.collection('pulse_conversations').add({
        userId,
        messages: [...initialMessages, responseMessage],
        title:
          (typeof firstUserMessage.content === 'string'
            ? firstUserMessage.content.substring(0, 40)
            : String(firstUserMessage.content)) +
          (typeof firstUserMessage.content === 'string' && firstUserMessage.content.length > 40
            ? '...'
            : ''),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      conversationRef = addedRef;
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
