'use server';
/**
 * @fileOverview The central orchestrator for the QoroPulse AI agent.
 * This flow manages the conversation, tool usage, and persistence.
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

import * as crmTools from '@/ai/tools/crm-tools';
import * as taskTools from '@/ai/tools/task-tools';
import * as financeTools from '@/ai/tools/finance-tools';
import * as supplierTools from '@/ai/tools/supplier-tools';

import * as pulseService from '@/services/pulseService';

/**
 * Sanitizes conversation history to conform to the expected format for the AI model.
 * It ensures roles are either 'user' or 'model' and filters out any invalid messages.
 */
function sanitizeHistory(messages: PulseMessage[]): { role: 'user' | 'model'; content: any[] }[] {
  const history: { role: 'user' | 'model'; content: any[] }[] = [];
  for (const msg of messages) {
    if (msg.role === 'assistant' || msg.role === 'model') {
      history.push({ role: 'model', content: [{ text: msg.content }] });
    } else if (msg.role === 'user') {
      history.push({ role: 'user', content: [{ text: msg.content }] });
    }
  }
  return history;
}

/**
 * Defines the main prompt for the QoroPulse agent, making all available tools accessible.
 */
const pulsePrompt = ai.definePrompt(
  {
    name: 'pulsePrompt',
    system: `Você é o QoroPulse, um assistente de negócios inteligente e proativo. 
      Sua personalidade é prestativa, direta e focada em resultados.
      Você tem acesso a ferramentas para buscar informações sobre CRM, finanças e tarefas.
      Responda de forma concisa e clara. Se precisar de mais informações para usar uma ferramenta, peça ao usuário.
      Ao criar uma tarefa, sempre confirme com o usuário após a criação.`,
    tools: [
      crmTools.getCrmSummaryTool,
      taskTools.listTasksTool,
      taskTools.createTaskTool,
      financeTools.getFinanceSummaryTool,
      financeTools.listAccountsTool,
      supplierTools.listSuppliersTool
    ],
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

    // Ensure there is at least one user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role !== 'user') {
      throw new Error('A última mensagem deve ser do usuário.');
    }

    // 1. PERSISTENCE: Create conversation if it's new
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
      // 2. GENERATE: First call to the AI with the user's query
      const history = sanitizeHistory(messages);
      const llmResponse = await pulsePrompt(history);

      // 3. TOOL CYCLE: Check if the AI wants to use a tool
      if (llmResponse.toolRequests.length > 0) {
        const toolResponses = [];
        
        // Add the AI's request to use a tool to the history
        history.push({ role: 'model', content: llmResponse.content });

        // Execute each tool request
        for (const toolRequest of llmResponse.toolRequests) {
          const toolResponse = await ai.runTool(toolRequest);
          toolResponses.push(toolResponse);
        }

        // Add the results of the tool calls to the history
        history.push({ role: 'user', content: toolResponses });

        // 4. GENERATE AGAIN: Call the AI again with the tool results
        const finalResponse = await pulsePrompt(history);
        
        const assistantMessage: PulseMessage = {
          role: 'assistant',
          content: finalResponse.text,
        };

        await pulseService.updateConversation(actor, conversationId, {
            messages: [...messages, assistantMessage],
        });

        return { conversationId, response: assistantMessage, title };

      } else {
        // 5. FINAL RESPONSE: If no tools are needed, return the AI's direct response
        const assistantMessage: PulseMessage = {
          role: 'assistant',
          content: llmResponse.text,
        };
        
        await pulseService.updateConversation(actor, conversationId, {
            messages: [...messages, assistantMessage]
        });

        return { conversationId, response: assistantMessage, title };
      }
    } catch (err: any) {
        console.error("QoroPulse Flow Error:", err);
        // Provide a more user-friendly error message
        const userFacingError = new Error("Desculpe, nosso sistema está passando por instabilidades. Tente novamente em alguns minutos. Se o problema persistir, entre em contato com o suporte.");
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
