'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from './firebase';

const auth = getAuth(app);
const db = getFirestore(app);

export const signUp = async (name: string, organization: string, email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Save user info to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      organization,
      email,
      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (!user.emailVerified) {
        // Optionally re-send verification email
        await sendEmailVerification(user);
        throw new Error('Por favor, verifique seu e-mail antes de fazer login. Um novo e-mail de verificação foi enviado.');
      }
  
      return user;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
};
