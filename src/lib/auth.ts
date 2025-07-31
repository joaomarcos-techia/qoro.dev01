
'use client';

import {
  getAuth,
  signInWithEmailAndPassword,
  sendEmailVerification,
  User,
  signOut as firebaseSignOut,
  updatePassword,
} from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

// The signUp logic is now handled by a Genkit flow for security reasons.
// The client-side signUp function has been removed.

export const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (!user.emailVerified) {
        // Optionally re-send verification email
        await sendEmailVerification(user);
        // Sign out the user immediately since they are not verified
        await firebaseSignOut(auth);
        throw new Error('Por favor, verifique seu e-mail antes de fazer login. Um novo e-mail de verificação foi enviado.');
      }
  
      return user;
    } catch (error) {
      console.error("Error signing in:", error);
      // If the error is the one we threw, re-throw it to show the user.
      if (error instanceof Error && error.message.includes('verifique seu e-mail')) {
        throw error;
      }
      // For other Firebase errors, provide a generic message.
      throw new Error('E-mail ou senha inválidos. Por favor, tente novamente.');
    }
};

export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

export const changePassword = async (newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Nenhum usuário autenticado encontrado.");
    }
    try {
        await updatePassword(user, newPassword);
    } catch (error) {
        console.error("Error changing password:", error);
        throw error;
    }
};
