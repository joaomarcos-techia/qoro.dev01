
'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Gera um título curto e preciso para uma conversa com base em seu conteúdo inicial.
 * @param context O conteúdo inicial da conversa.
 * @returns Uma string com o título gerado, com no máximo 3 palavras.
 */
export async function generateConversationTitle(context: string): Promise<string> {
  if (!context || context.trim() === '') {
    return 'Nova Conversa';
  }

  try {
    const aiPrompt = `
Crie um título curto e preciso de no máximo 3-4 palavras para a conversa abaixo.
Foque no tema central ou objetivo da conversa.
Retorne apenas o título, sem pontuação ou aspas.

Início da conversa:
---
${context}
---
    `.trim();

    const result = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-001'),
      prompt: aiPrompt,
      config: { temperature: 0.1, maxOutputTokens: 15 },
    });

    const rawTitle = result.text ?? '';
    // Remove aspas do início/fim e pontuação final
    const title = rawTitle.trim().replace(/^["']|["']$/g, '').replace(/[.!?]+$/, '');

    // Valida se o título gerado é útil
    if (title && title.split(/\s+/).length <= 5) {
      return title;
    }
  } catch (error) {
    console.error("Erro ao gerar título com IA:", error);
    // A execução continua para o fallback
  }

  // Fallback: Pega as 3 primeiras palavras úteis se a IA falhar ou retornar algo inválido
  const usefulWords = context.replace(/\b(user|assistant|model|user:|assistant:|model:)\b/gi, '').trim().split(/\s+/).filter(word => word.length > 2).slice(0, 3);

  if (usefulWords.length > 0) {
    return usefulWords.join(' ');
  }

  return 'Nova Conversa';
}

    