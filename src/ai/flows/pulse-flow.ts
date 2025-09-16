'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema, AskPulseOutputSchema, PulseMessage } from '@/ai/schemas';
import { getCrmSummaryTool } from '@/ai/tools/crm-tools';
import { createTaskTool, listTasksTool } from '@/ai/tools/task-tools';
import { listAccountsTool, getFinanceSummaryTool } from '@/ai/tools/finance-tools';
import { listSuppliersTool } from '@/ai/tools/supplier-tools';
import * as pulseService from '@/services/pulseService';

const PulseResponseSchema = z.object({
  response: z.string().describe('The final, user-facing response from the AI.'),
  title: z.string().optional().describe('A short, descriptive title for the conversation if a new one is needed.'),
});

/**
 * Sanitizes messages to ensure compatibility with Genkit models.
 */
function sanitizeHistory(messages: PulseMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  })).filter(m => m.parts[0].text.trim().length > 0);
}

/**
 * Checks if a suggested title is meaningful or just a rehash of the first message.
 */
function isTitleDerivedFromFirstMessage(suggested?: string, firstUser?: string): boolean {
  if (!suggested?.trim() || !firstUser?.trim()) return true;
  const a = suggested.trim().toLowerCase();
  const b = firstUser.trim().toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

// Main QoroPulse flow
const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: AskPulseOutputSchema,
  },
  async (input) => {
    const { actor, messages: clientMessages } = input;
    let { conversationId } = input;

    // 1. Validate input
    if (!actor?.trim()) throw new Error('Actor is required.');
    if (!Array.isArray(clientMessages) || clientMessages.length === 0) throw new Error('Message list is required.');
    const lastUserMessage = clientMessages[clientMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user' || !lastUserMessage.content.trim()) throw new Error('Last message must be a non-empty message from the user.');

    // 2. Load or create conversation
    let conversationHistory: PulseMessage[] = [];
    let currentTitle = 'Nova Conversa';

    if (conversationId) {
      const loadedConv = await pulseService.getConversation({ conversationId, actor });
      if (loadedConv) {
        conversationHistory = loadedConv.messages || [];
        currentTitle = loadedConv.title || 'Nova Conversa';
      } else {
        throw new Error('Conversation not found.');
      }
    } else {
      const created = await pulseService.createConversation({ actor, messages: [lastUserMessage] });
      conversationId = created.id;
      conversationHistory = [lastUserMessage];
      currentTitle = created.title;
    }

    // 3. Prepare AI history
    const aiHistory = sanitizeHistory(conversationHistory);

    // 4. Define AI system prompt and tools
    const systemPrompt = `Você é o QoroPulse, um agente de IA especialista em gestão empresarial.
- Forneça insights acionáveis baseados nos dados da Qoro.
- Se for uma nova conversa, SEMPRE sugira um título curto e descritivo no campo 'title' da resposta.
- Use as ferramentas disponíveis para obter dados. Não invente informações.
- Aja como se soubesse a informação diretamente, sem mencionar o uso de ferramentas.
- Seja direto, executivo e amigável.`;

    const availableTools = [getCrmSummaryTool, listTasksTool, createTaskTool, listAccountsTool, getFinanceSummaryTool, listSuppliersTool];

    // 5. Generate AI response (with potential tool use)
    let llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      history: aiHistory,
      tools: availableTools,
      toolConfig: { context: { actor } },
      system: systemPrompt,
      output: { schema: PulseResponseSchema },
    });

    const toolRequests = llmResponse.toolRequests();

    // 6. Handle tool requests if any
    if (toolRequests?.length > 0) {
      const modelMessage = { role: 'model' as const, parts: toolRequests.map(toolRequest => ({ toolRequest })) };
      aiHistory.push(modelMessage);

      const toolOutputs = await Promise.all(
        toolRequests.map(async (toolRequest) => {
          try {
            const output = await ai.runTool(toolRequest, { context: { actor } });
            return { toolResponse: { name: toolRequest.name, output } };
          } catch (err) {
            console.error(`Error in tool ${toolRequest.name}:`, err);
            return { toolResponse: { name: toolRequest.name, output: { __error: true, message: 'Tool temporarily unavailable' } } };
          }
        })
      );

      aiHistory.push({ role: 'tool' as const, parts: toolOutputs });

      // Second call to AI with tool results
      llmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        history: aiHistory,
        system: systemPrompt,
        output: { schema: PulseResponseSchema },
      });
    }

    // 7. Process final output and save
    const finalOutput = llmResponse.output();
    const assistantResponseText = finalOutput?.response?.trim() || 'Desculpe, não consegui processar sua solicitação.';
    const suggestedTitle = finalOutput?.title?.trim();

    let titleToSave = currentTitle;
    const firstUserContent = conversationHistory.find(m => m.role === 'user')?.content || '';
    if (suggestedTitle && !isTitleDerivedFromFirstMessage(suggestedTitle, firstUserContent)) {
      titleToSave = suggestedTitle;
    }

    const assistantMessage: PulseMessage = { role: 'assistant', content: assistantResponseText };
    const allMessages = [...conversationHistory, assistantMessage];

    await pulseService.updateConversation(actor, conversationId!, { messages: allMessages, title: titleToSave });

    return {
      conversationId: conversationId!,
      title: titleToSave,
      response: assistantMessage,
    };
  }
);

/**
 * Client-callable wrapper for the main flow with an emergency fallback.
 */
export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<z.infer<typeof AskPulseOutputSchema>> {
  try {
    return await pulseFlow(input);
  } catch (error) {
    console.error('Critical error in askPulse flow:', error);
    // Emergency fallback response
    return {
      conversationId: input.conversationId || 'error-conv',
      title: 'Erro de Sistema',
      response: {
        role: 'assistant',
        content: 'Desculpe, nosso sistema está passando por instabilidades. Tente novamente em alguns minutos. Se o problema persistir, entre em contato com o suporte.',
      },
    };
  }
}

// Flow for deleting a conversation
const deleteConversationFlow = ai.defineFlow(
  {
    name: 'deleteConversationFlow',
    inputSchema: z.object({ conversationId: z.string(), actor: z.string() }),
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ conversationId, actor }) => {
    return pulseService.deleteConversation({ conversationId, actor });
  }
);

export async function deleteConversation(input: { conversationId: string; actor: string; }): Promise<{ success: boolean }> {
  return deleteConversationFlow(input);
}
