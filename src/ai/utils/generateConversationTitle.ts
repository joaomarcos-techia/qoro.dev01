
'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { PulseMessage } from '../schemas';

/**
 * Gera um título curto (máx. 3 palavras) para uma conversa
 * baseado no contexto das primeiras mensagens.
 * @param messages Histórico inicial da conversa (PulseMessage[]).
 */
export async function generateConversationTitle(messages: PulseMessage[]): Promise<string> {
  const fallbackTitle = 'Nova Conversa';

  if (!Array.isArray(messages) || messages.length === 0) {
    return fallbackTitle;
  }

  // Constrói um contexto mais rico com as primeiras mensagens
  const context = messages
    .slice(0, 3) // Pega as 3 primeiras mensagens para contexto
    .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
    .join('\n');

  try {
    const aiPrompt = `
Crie um título curto e objetivo (máximo 3 palavras) para a conversa abaixo.
Foque no tema central da conversa.
Retorne só o título, sem aspas, sem pontuação.

Início da conversa:
---
${context}
---
    `.trim();

    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: aiPrompt,
      config: { temperature: 0.1, maxOutputTokens: 10 },
    });

    let rawTitle = result.text ?? '';
    let title = rawTitle
      .trim()
      .replace(/^["']|["']$/g, '') // remove aspas
      .replace(/[.!?]+$/, ''); // remove pontuação final

    // Garante no máximo 3 palavras
    const words = title.split(/\s+/).slice(0, 3);
    title = words.join(' ');

    if (title) {
      return title;
    }
  } catch (error) {
    console.error('Erro ao gerar título com IA:', error);
  }

  // Fallback: até 3 palavras das primeiras mensagens do usuário
  const userMessageContent = messages.find(m => m.role === 'user')?.content || '';
  const usefulWords = userMessageContent
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3);

  if (usefulWords.length > 0) {
    return usefulWords.join(' ');
  }

  return fallbackTitle;
}
