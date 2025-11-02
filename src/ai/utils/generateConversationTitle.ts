
'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { PulseMessage } from '../schemas';

/**
 * Gera um título curto (máx. 2-3 palavras) baseado no histórico da conversa.
 * @param messages Histórico da conversa (PulseMessage[]).
 */
export async function generateConversationTitle(messages: PulseMessage[]): Promise<string> {
  const fallbackTitle = 'Nova conversa';

  if (!Array.isArray(messages) || messages.length < 2) {
    return fallbackTitle;
  }

  // Pega as 5 primeiras mensagens para ter um bom contexto inicial
  const contextMessages = messages.slice(0, 5);
  const context = contextMessages
    .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
    .join('\n');

  try {
    const aiPrompt = `
Analise o contexto das mensagens abaixo e crie um título conciso com 2 a 4 palavras
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
      config: { temperature: 0.2, maxOutputTokens: 10 },
    });

    let title = (result.text ?? '').trim();
    // Limpa pontuações e aspas que a IA possa adicionar
    title = title.replace(/^["'“‘]|["'”’.,!?]+$/g, ''); 
    
    if (title) {
      return title;
    }
  } catch (error) {
    console.error('Erro ao gerar título com IA:', error);
  }

  // Fallback caso a IA falhe: primeiras palavras da primeira mensagem do usuário
  const userMessageContent = messages.find(m => m.role === 'user')?.content || '';
  const fallbackWords = userMessageContent.trim().split(/\s+/).slice(0, 3);

  return fallbackWords.length > 0 ? fallbackWords.join(' ') : fallbackTitle;
}

    