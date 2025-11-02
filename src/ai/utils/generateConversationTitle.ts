
// src/utils/generateConversationTitle.ts
'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { PulseMessage } from '../schemas';

/**
 * Gera um título curto (máx. 2 palavras) baseado nas três primeiras mensagens do usuário.
 * @param messages Histórico inicial da conversa (PulseMessage[]).
 */
export async function generateConversationTitle(messages: PulseMessage[]): Promise<string> {
  const fallbackTitle = 'Nova conversa';

  if (!Array.isArray(messages) || messages.length === 0) {
    return fallbackTitle;
  }

  // Filtra apenas mensagens do usuário
  const userMessages = messages.filter(m => m.role === 'user').slice(0, 3);

  if (userMessages.length === 0) {
    return fallbackTitle;
  }

  // Constrói contexto a partir das 3 primeiras mensagens do usuário
  const context = userMessages.map(m => `Usuário: ${m.content}`).join('\n');

  try {
    const aiPrompt = `
Analise o contexto das mensagens abaixo e crie um título conciso com no máximo 2 palavras
que capture o tema central da conversa.
Retorne apenas o título, sem aspas, pontuação ou formatação adicional.

Mensagens:
---
${context}
---
Título:
    `.trim();

    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: aiPrompt,
      config: { temperature: 0.1, maxOutputTokens: 10 },
    });

    let title = (result.text ?? '').trim();
    title = title.replace(/^["'“‘]|["'”’.,!?]+$/g, ''); // Limpa aspas e pontuação
    const words = title.split(/\s+/).filter(Boolean).slice(0, 2); // Máx. 2 palavras
    title = words.join(' ');

    if (title) {
      return title;
    }
  } catch (error) {
    console.error('Erro ao gerar título com IA:', error);
  }

  // Fallback: primeiras 2 palavras da primeira mensagem do usuário
  const userMessageContent = userMessages[0]?.content || '';
  const fallbackWords = userMessageContent.trim().split(/\s+/).slice(0, 2);

  return fallbackWords.length > 0 ? fallbackWords.join(' ') : fallbackTitle;
}
