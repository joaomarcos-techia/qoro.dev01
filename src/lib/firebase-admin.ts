// src/lib/firebase-admin.ts
import { App, getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

if (!getApps().length) {
  // Em um ambiente de deploy do Firebase, as credenciais são injetadas automaticamente.
  // Em um ambiente local, elas devem ser fornecidas via variáveis de ambiente.
  if (process.env.NODE_ENV === 'production') {
    app = initializeApp();
  } else {
    // Lógica para ambiente local (requer que as variáveis estejam no .env)
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      app = initializeApp(); // Tenta inicializar sem credenciais, pode funcionar em alguns emuladores.
    } else {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/"/g, "");
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
  }
} else {
  app = getApps()[0]!;
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { app as adminApp, adminAuth, adminDb };
