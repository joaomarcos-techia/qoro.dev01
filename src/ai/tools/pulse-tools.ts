
'use server';
/**
 * @fileOverview Defines Genkit tools for the Pulse module.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const generateTitleTool = ai.defineTool(
    {
        name: 'generateTitleTool',
        description: 'Gera um título curto e conciso para uma conversa com base na primeira interação.',
        inputSchema: z.object({
            prompt: z.string().describe('O prompt inicial do usuário.'),
            response: z.string().describe('A resposta inicial do assistente.'),
        }),
        outputSchema: z.string(),
    },
    async (input) => {
        const llmResponse = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: `Crie um título curto (máximo 5 palavras) para a seguinte conversa:\n\nUsuário: ${input.prompt}\nAssistente: ${input.response}`,
        });
        return llmResponse.text.replace(/"/g, ''); // Remove quotes from title
    }
);
