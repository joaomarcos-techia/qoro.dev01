// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Helper function to access secrets from Google Secret Manager
async function getSecret(secretName: string): Promise<string> {
  // Use a default project ID if running locally or if it's not set
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || 'qoro-iy1gs';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  if (process.env.NODE_ENV !== 'production' && process.env[secretName]) {
    return process.env[secretName]!;
  }
  
  try {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Secret ${secretName} payload is empty.`);
    }
    return payload;
  } catch (error: any) {
    console.error(`Failed to access secret "${secretName}":`, error.message);
    // Fallback to environment variable if available, otherwise throw
    if (process.env[secretName]) {
      return process.env[secretName]!;
    }
    throw new Error(`Could not retrieve secret ${secretName} from Secret Manager or environment variables.`);
  }
}

let aiInstance: any;

async function initializeGenkit() {
    if (aiInstance) {
        return aiInstance;
    }

    const apiKey = await getSecret('GEMINI_API_KEY');

    aiInstance = genkit({
      plugins: [
        googleAI({
          apiKey: apiKey,
        }),
      ],
    });
    
    return aiInstance;
}

// Export a promise that resolves to the initialized 'ai' object
export const ai = initializeGenkit();

export { googleAI };
