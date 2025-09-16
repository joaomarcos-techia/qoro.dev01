import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Ensure the API key is passed correctly, providing a fallback empty string.
const apiKey = process.env.GOOGLE_API_KEY || '';
if (!apiKey) {
  console.warn(
    'GOOGLE_API_KEY is not defined. Genkit will not be able to interat with Google AI services.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  // Log all traces to the console in development.
  enableTracingAndMetrics: process.env.NODE_ENV === 'development',
  // Log to a file during development.
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});
