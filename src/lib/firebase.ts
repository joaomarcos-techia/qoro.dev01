// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Security check: ensure environment variables are loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'As variáveis de ambiente do Firebase não estão definidas. ' +
      'Verifique se NEXT_PUBLIC_FIREBASE_API_KEY e NEXT_PUBLIC_FIREBASE_PROJECT_ID estão no seu arquivo .env'
    );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Initialize Firestore with the setting to ignore undefined properties.
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});


export { app, auth, db };
