
'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { PulseMessage } from '../schemas';

/**
 * Gera um título curto e contextual (2 palavras) baseado nas primeiras mensagens do usuário.
 */
export async function generateConversationTitle(messages: PulseMessage[]): Promise<string> {
  const fallbackTitle = 'Nova conversa';

  if (!Array.isArray(messages) || messages.length === 0) {
    return fallbackTitle;
  }

  // Garante que estamos pegando apenas mensagens do usuário e no máximo as 3 primeiras.
  const userMessages = messages.filter(m => m.role === 'user').slice(0, 3);

  if (userMessages.length === 0) {
    return fallbackTitle;
  }

  const context = userMessages
    .map(m => `Usuário: ${m.content}`)
    .join('\n');

  try {
    // Prompt mais direto e focado em sintetizar, não apenas extrair.
    const aiPrompt = `
Analise o seguinte diálogo e resuma o tópico principal em exatamente duas palavras para ser usado como um título.

Diálogo:
---
${context}
---
Título Conciso:
    `.trim();

    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: aiPrompt,
      config: { temperature: 0.1, maxOutputTokens: 10 },
    });

    let title = (result.text ?? '').trim();
    
    // Limpeza rigorosa de pontuações, aspas e quebras de linha
    title = title.replace(/^["'“‘]|["'”’.,!?\n\r]+$/g, '');
    
    // Garante que o título tenha no máximo 2 palavras
    const words = title.split(/\s+/).filter(Boolean).slice(0, 2);
    title = words.join(' ');

    if (title) {
      return title;
    }
  } catch (error) {
    console.error('Erro ao gerar título com IA:', error);
  }

  // Fallback: 2 primeiras palavras da primeira mensagem do usuário
  const fallbackWords = userMessages[0]?.content?.trim().split(/\s+/).slice(0, 2) || [];
  return fallbackWords.length > 0 ? fallbackWords.join(' ') : fallbackTitle;
}
