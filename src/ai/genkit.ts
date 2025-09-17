
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Ensure the API key is passed correctly, providing a fallback empty string.
const apiKey = process.env.GOOGLE_API_KEY || '';
if (!apiKey) {
  console.warn(
    'AVISO: A variável de ambiente GOOGLE_API_KEY não está definida. A comunicação com a Google AI API falhará.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  // Log to a file during development.
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});
