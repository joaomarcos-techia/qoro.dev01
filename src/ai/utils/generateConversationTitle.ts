'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { PulseMessage } from '../schemas';

/**
 * Gera um título curto e contextual (3 palavras) baseado no diálogo inicial.
 * Se a geração falhar, retorna a mensagem de erro como título para depuração.
 */
export async function generateConversationTitle(messages: PulseMessage[]): Promise<string> {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Contexto de mensagem insuficiente';
  }

  const context = messages
    .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
    .join('\n');

  try {
    const aiPrompt = `
Você é um especialista em Processamento de Linguagem Natural (PLN).
Sua tarefa é analisar um diálogo e criar um título de EXATAMENTE 3 palavras que resuma o assunto principal.

Exemplo de diálogo:
Usuário: Olá, preciso de ajuda com o caixa da minha empresa.
Assistente: Olá! Claro. Para te ajudar melhor, você pode me dizer qual é o seu desafio principal com o fluxo de caixa?

Título Conciso:
Controle de Fluxo de Caixa

Agora, faça o mesmo para o diálogo abaixo, retornando APENAS as 3 palavras do título.

Diálogo:
---
${context}
---
Título Conciso:
    `.trim();

    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: aiPrompt,
      config: { temperature: 0.1, maxOutputTokens: 15 },
    });

    let title = (result.text ?? '').trim();
    
    // Limpeza final para remover aspas ou pontuações que a IA possa adicionar
    title = title.replace(/^["'“‘]|["'”’,.!?]+$/g, '');

    // Se o título for válido, retorna capitalizado, senão retorna um erro indicativo.
    if (title && title.split(' ').length > 1) {
        return title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    // Se a IA retornar algo inválido (ex: vazio ou uma única palavra), tratamos como um erro.
    return "IA retornou título inválido";

  } catch (error: any) {
    console.error('Erro ao gerar título com IA, retornando erro como título:', error);
    // Retorna a mensagem de erro exata como o título.
    return error.message || 'Erro desconhecido na geração do título';
  }
}
