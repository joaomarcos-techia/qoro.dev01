
'use server';
/**
 * @fileOverview A conversational AI agent for business insights.
 * - askPulse - A function that handles the conversational chat with QoroPulse.
 * - AskPulseInput - The input type for the askPulse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema } from '@/ai/schemas';
import { listCustomersTool, listSaleLeadsTool } from '@/ai/tools/crm-tools';
import { listTasksTool } from '@/ai/tools/task-tools';

export async function askPulse(input: z.infer<typeof AskPulseInputSchema>): Promise<string> {
  return pulseFlow(input);
}

const pulseFlow = ai.defineFlow(
  {
    name: 'pulseFlow',
    inputSchema: AskPulseInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { history, prompt, actor } = input.messages.reduce(
        (acc, message) => {
          if (message.role === 'assistant') {
            acc.history.push({ role: 'model', parts: [{ text: message.content }] });
          } else {
            // Check if it's the last message (the current prompt)
            if (acc.prompt === '') {
                 acc.prompt = message.content;
            } else {
                // Older user messages are also part of history
                acc.history.push({ role: 'user', parts: [{ text: message.content }] });
            }
          }
          return acc;
        },
        { history: [] as any[], prompt: '', actor: input.actor }
      );

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: prompt,
        history: history,
        tools: [listCustomersTool, listSaleLeadsTool, listTasksTool],
        toolConfig: {
          // Pass the actor UID to the tool through the request context
          context: { actor },
        },
        system: `Você é o QoroPulse, um especialista em análise de negócios e o cérebro da plataforma Qoro.
        Sua missão é fornecer insights claros, acionáveis e concisos para ajudar PMEs a prosperar.
        Você é amigável, profissional e sempre focado em dados.

        Para responder às perguntas, você DEVE usar as ferramentas fornecidas para acessar os dados da empresa.
        - Use a ferramenta 'listCustomersTool' para perguntas sobre clientes.
        - Use a ferramenta 'listSaleLeadsTool' para perguntas sobre o funil de vendas.
        - Use a ferramenta 'listTasksTool' para perguntas sobre tarefas, projetos e produtividade.
        
        Analise os dados retornados pelas ferramentas para formular sua resposta.
        
        Nunca diga que você é um modelo de linguagem ou uma IA. Você é o QoroPulse.`,
    });

    return llmResponse.text;
  }
);
