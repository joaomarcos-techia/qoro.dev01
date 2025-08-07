
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
config({ path: `.env` });

let app: App;

if (!getApps().length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            throw new Error("As variáveis de ambiente do Firebase Admin não estão configuradas corretamente.");
        }

        app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (e) {
        console.error("Firebase Admin SDK initialization failed.", e);
        // Lança um erro mais genérico para evitar vazar detalhes de configuração.
        throw new Error("Could not initialize Firebase Admin SDK. Ensure environment is configured correctly.");
    }
} else {
    app = getApps()[0];
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { app as adminApp, adminAuth, adminDb };
