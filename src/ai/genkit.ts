// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// A chave da API é injetada automaticamente pelo App Hosting a partir do Secret Manager
// usando a configuração em apphosting.yaml.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // Em produção, isso indicaria um problema de configuração no deploy.
  // Em desenvolvimento, isso significa que a variável não está no .env.
  throw new Error("A variável de ambiente GEMINI_API_KEY não está definida.");
}

// Inicializa o genkit diretamente. Não é mais necessário um wrapper assíncrono.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});

export { googleAI };
