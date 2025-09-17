'use server';
/**
 * @fileOverview The central orchestrator for the QoroPulse AI agent.
 * This flow manages the conversation and persistence.
 *
 * - askPulse: The main function that handles user queries.
 * - deleteConversation: Deletes a conversation history.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  AskPulseInputSchema,
  AskPulseOutputSchema,
  PulseMessage,
  PulseMessageSchema
} from '@/ai/schemas';

import * as pulseService from '@/services/pulseService';

/**
 * Sanitizes conversation history to conform to the expected format for the AI model.
 * It ensures roles are either 'user' or 'model' and wraps content in the { text: ... } format.
 */
function sanitizeHistory(messages: PulseMessage[]): { role: 'user' | 'model'; content: any[] }[] {
  const history: { role: 'user' | 'model'; content: any[] }[] = [];
  for (const msg of messages) {
    if ((msg.role === 'assistant' || msg.role === 'model') && msg.content) {
      history.push({ role: 'model', content: [{ text: msg.content }] });
    } else if (msg.role === 'user' && msg.content) {
      history.push({ role: 'user', content: [{ text: msg.content }] });
    }
  }
  return history;
}

/**
 * Defines the main prompt for the QoroPulse agent.
 */
const pulsePrompt = ai.definePrompt(
  {
    name: 'pulsePrompt',
    system: `Você é o QoroPulse, um assistente de negócios inteligente e proativo. 
      Sua personalidade é prestativa, direta e focada em resultados.
      Você NÃO tem acesso a ferramentas ou dados do usuário. Responda de forma concisa e clara com base no seu conhecimento geral.`,
  },
  async (history) => {
    return {
      history,
    };
  }
);


const askPulseFlow = ai.defineFlow(
  {
    name: 'askPulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input) => {
    const { messages, actor, conversationId: existingConvId } = input;
    let conversationId = existingConvId;
    let title = 'Nova Conversa';

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role !== 'user') {
      throw new Error('A última mensagem deve ser do usuário.');
    }

    if (!conversationId) {
        const newConversation = await pulseService.createConversation({
            actor,
            messages: [lastUserMessage],
            title: lastUserMessage.content.substring(0, 40),
        });
        conversationId = newConversation.id;
        title = newConversation.title;
    }

    try {
      // 1. Sanitize history for the AI model
      const history = sanitizeHistory(messages);
      
      // 2. Call the AI with the user's query
      const llmResponse = await pulsePrompt(history);

      const assistantMessage: PulseMessage = {
        role: 'assistant',
        content: llmResponse.text,
      };
      
      await pulseService.updateConversation(actor, conversationId, {
          messages: [...messages, assistantMessage]
      });

      return { conversationId, response: assistantMessage, title };

    } catch (err: any) {
        console.error("QoroPulse Flow Error:", err);
        const userFacingError = new Error("Erro ao comunicar com a IA. Tente novamente.");
        (userFacingError as any).originalError = err.message;
        throw userFacingError;
    }
  }
);


const deleteConversationFlow = ai.defineFlow({
    name: 'deleteConversationFlow',
    inputSchema: z.object({ conversationId: z.string(), actor: z.string() }),
    outputSchema: z.object({ success: z.boolean() }),
}, async (input) => {
    return await pulseService.deleteConversation(input);
});


export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<z.infer<typeof AskPulseOutputSchema>> {
    return askPulseFlow(input);
}

export async function deleteConversation(input: { conversationId: string; actor: string; }): Promise<{ success: boolean; }> {
    return deleteConversationFlow(input);
}
