// src/lib/firebase-admin.ts
import { App, getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

if (!getApps().length) {
  // Em um ambiente de deploy do Firebase (produção), as credenciais são injetadas automaticamente.
  // Para desenvolvimento local, as variáveis de ambiente devem ser fornecidas via .env.
  const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }
    : undefined;

  app = initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined);
} else {
  app = getApps()[0]!;
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { app as adminApp, adminAuth, adminDb };
