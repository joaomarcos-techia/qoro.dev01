
// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_API_KEY || '';
if (!apiKey) {
  console.warn(
    'AVISO: A variável de ambiente GOOGLE_API_KEY não está definida. A comunicação com a Google AI API falhará.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey,
    }),
  ],
});

export { googleAI };
