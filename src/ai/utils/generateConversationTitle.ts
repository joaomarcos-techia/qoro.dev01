
'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { PulseMessage } from '../schemas';

/**
 * Gera um título curto e contextual (2 palavras) baseado nas primeiras mensagens do usuário.
 * Esta versão é focada em extração de palavras-chave para maior robustez.
 */
export async function generateConversationTitle(messages: PulseMessage[]): Promise<string> {
  const fallbackTitle = 'Nova conversa';

  if (!Array.isArray(messages) || messages.length === 0) {
    return fallbackTitle;
  }

  // Pega até as 3 primeiras mensagens do usuário
  const userMessages = messages.filter(m => m.role === 'user').slice(0, 3);
  if (userMessages.length === 0) {
    return fallbackTitle;
  }

  const context = userMessages
    .map(m => `Usuário: ${m.content}`)
    .join('\n');

  try {
    const aiPrompt = `
Analise a conversa abaixo e extraia as 2 a 3 palavras-chave mais importantes (verbos ou substantivos) que definem o assunto principal.
Retorne apenas as palavras-chave, sem pontuação, sem aspas e sem formatação.

CONVERSA:
---
${context}
---
PALAVRAS-CHAVE:
    `.trim();

    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: aiPrompt,
      config: { temperature: 0.1, maxOutputTokens: 12 },
    });

    let title = (result.text ?? '').trim();
    
    // Limpeza rigorosa: remove qualquer coisa que não seja letras, números ou espaços.
    title = title.replace(/[^\p{L}\p{N}\s]/gu, '');

    // Garante no máximo 3 palavras para concisão.
    title = title.split(/\s+/).filter(Boolean).slice(0, 3).join(' ');

    if (title) {
      // Capitaliza a primeira letra de cada palavra para um bom formato de título.
      return title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  } catch (error) {
    console.error('Erro ao gerar título com IA:', error);
  }

  // Fallback: 2 primeiras palavras da 1ª mensagem do usuário
  const fallbackWords = userMessages[0]?.content?.trim().split(/\s+/).slice(0, 2) || [];
  if (fallbackWords.length > 0) {
      return fallbackWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  return fallbackTitle;
}
