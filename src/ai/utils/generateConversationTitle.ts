
import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/googleai';

export async function generateConversationTitle(firstUserMessage: string): Promise<string> {
  if (!firstUserMessage || firstUserMessage.trim().length === 0) {
    return "Nova conversa";
  }

  // Fallback para saudações comuns
  const commonGreetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'];
  if (commonGreetings.includes(firstUserMessage.toLowerCase().trim())) {
      return "Nova Conversa";
  }

  try {
    const result = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      prompt: `
Resuma o seguinte texto em **no máximo 3 palavras**.
Retorne apenas o título curto, nada mais.

Texto: "${firstUserMessage}"
`.trim(),
      config: {
        temperature: 0.2,
        maxOutputTokens: 10,
      },
    });

    const title = result.text?.trim();
    if (title) return title;
  } catch (err) {
    console.error("Erro ao gerar título com IA:", err);
  }

  // fallback se a IA não responder
  return firstUserMessage.length > 20
    ? firstUserMessage.substring(0, 20) + "..."
    : firstUserMessage;
}
