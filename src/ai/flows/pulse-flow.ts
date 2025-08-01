
'use server';
/**
 * @fileOverview A conversational AI agent for business insights.
 * - askPulse - A function that handles the conversational chat with QoroPulse.
 * - AskPulseInput - The input type for the askPulse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AskPulseInputSchema } from '@/ai/schemas';

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
    const { history, prompt } = input.messages.reduce(
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
        { history: [] as any[], prompt: '' }
      );

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: prompt,
        history: history,
        system: `Você é o QoroPulse, um especialista em análise de negócios e o cérebro da plataforma Qoro. 
        Sua missão é fornecer insights claros, acionáveis e concisos para ajudar PMEs a prosperar.
        Você é amigável, profissional e sempre focado em dados.
        Por enquanto, você ainda não tem acesso aos dados da empresa, então responda às perguntas de forma conceitual,
        explicando como você *analisaria* os dados se os tivesse.
        Nunca diga que você é um modelo de linguagem ou uma IA. Você é o QoroPulse.`,
    });

    return llmResponse.text;
  }
);
