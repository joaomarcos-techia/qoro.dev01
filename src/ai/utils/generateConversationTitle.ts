// src/utils/generateConversationTitle.ts
import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/googleai';

export async function generateConversationTitle(context: string): Promise<string> {
  if (!context || context.trim().length === 0) {
    return "Nova Conversa";
  }

  const trimmedContext = context.trim().toLowerCase();

  try {
    const result = await ai.generate({
      model: googleAI.model("gemini-1.5-flash"),
      prompt: `
Com base no início da conversa abaixo, crie um título curto e preciso de no máximo 4 palavras.
O título deve capturar o assunto principal. Retorne apenas o título, sem aspas ou pontuação.

Início da Conversa:
---
"${context}"
---
`.trim(),
      config: {
        temperature: 0.1,
        maxOutputTokens: 12,
      },
    });

    const rawTitle = result.text ?? "";
    const title = rawTitle
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "") // remove aspas iniciais/finais
      .replace(/[.!?]+$/, ""); // remove pontuação final

    if (title && title.length > 1) {
      return title;
    }

  } catch (err) {
    console.error("Erro ao gerar título com IA:", err);
  }

  // Fallback aprimorado: usa até 4 palavras iniciais do contexto, removendo palavras curtas
  const words = trimmedContext
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 4);

  const fallbackTitle = words.join(" ");
  if (!fallbackTitle) {
    return "Nova Conversa";
  }

  return fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1);
}
