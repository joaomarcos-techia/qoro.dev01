'use server';

/**
 * @fileOverview Orquestrador principal do QoroPulse.
 * Responsável por coordenar mensagens, histórico, ferramentas e chamadas ao LLM.
 */

import { ai } from '@/ai/genkit';
import { defineFlow } from '@genkit-ai/core';
import { z } from 'zod';

// 🔹 Ferramentas do sistema
import pulseTools from '@/ai/tools/pulse-tools';
import * as crmTools from '@/ai/tools/crm-tools';
import * as taskTools from '@/ai/tools/task-tools';
import * as financeTools from '@/ai/tools/finance-tools';

// 🔹 Serviços auxiliares
import * as pulseService from '@/services/pulseService';
import { gemini15Flash } from '@/ai/models';

// =============================
// Tipagem
// =============================
const AskPulseInput = z.object({
  conversationId: z.string().optional(),
  prompt: z.string(),
  actor: z.string(), // UID do usuário logado
});

const AskPulseOutput = z.object({
  answer: z.string(),
  conversationId: z.string(),
});

// =============================
// Fluxo principal
// =============================
export const askPulse = defineFlow(
  {
    name: 'askPulse',
    inputSchema: AskPulseInput,
    outputSchema: AskPulseOutput,
  },
  async (input) => {
    const { conversationId, prompt, actor } = input;

    if (!actor) {
      throw new Error('User must be authenticated to interact with QoroPulse.');
    }

    // Carregar histórico salvo
    const dbHistory = conversationId
      ? await pulseService.getConversationHistory(conversationId, actor)
      : [];

    // Montar histórico no formato do LLM
    const newHistory = [
      ...dbHistory,
      {
        role: 'user',
        content: prompt,
      },
    ];

    // 🔑 Consolidar todas as ferramentas
    const allTools = {
      ...pulseTools,
      ...crmTools,
      ...taskTools,
      ...financeTools,
    };

    // Primeira chamada ao modelo
    const llmResponse = await ai.generate({
      model: gemini15Flash,
      tools: Object.values(allTools),
      history: newHistory,
      input: prompt,
      context: { actor },
    });

    let finalAnswer = llmResponse.output;

    // Se o modelo pediu ferramentas, executa
    if (llmResponse.toolRequests && llmResponse.toolRequests.length > 0) {
      for (const toolReq of llmResponse.toolRequests) {
        if (allTools[toolReq.name]) {
          const toolResult = await ai.runTool(allTools[toolReq.name], {
            input: toolReq.input,
            context: { actor },
          });

          // Rodar nova chamada ao modelo, agora com o resultado da ferramenta
          const secondResponse = await ai.generate({
            model: gemini15Flash,
            history: [
              ...newHistory,
              {
                role: 'tool',
                content: JSON.stringify(toolResult),
              },
            ],
            input: `O resultado da ferramenta ${toolReq.name} foi ${JSON.stringify(toolResult)}. Responda ao usuário com base nisso.`,
            context: { actor },
          });

          finalAnswer = secondResponse.output;
        }
      }
    }

    // Salvar a conversa
    const savedConversationId = await pulseService.saveConversation({
      conversationId,
      actor,
      prompt,
      answer: finalAnswer,
    });

    return {
      answer: finalAnswer,
      conversationId: savedConversationId,
    };
  }
);
