// src/lib/firebase-admin.ts
import { App, getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

if (!getApps().length) {
  // Em um ambiente de produção do Google Cloud (como App Hosting), as credenciais são injetadas automaticamente.
  // O SDK Admin detecta isso e deve ser inicializado sem argumentos.
  if (process.env.NODE_ENV === 'production') {
    app = initializeApp();
  } else {
    // Para desenvolvimento local, as variáveis de ambiente devem ser fornecidas via .env.
    const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
      ? {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      : undefined;

    if (!serviceAccount) {
        console.warn("Credenciais do Firebase Admin não encontradas no .env. A inicialização pode falhar se não estiver em um ambiente GCP.");
    }

    app = initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined);
  }
} else {
  app = getApps()[0]!;
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { app as adminApp, adminAuth, adminDb };
