

'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  User,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

// New function to handle user creation and email verification on the client-side
export const createUserAndSendVerification = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        return user;
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este e-mail já está em uso.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.');
        }
        throw new Error('Ocorreu um erro ao criar o usuário. Tente novamente.');
    }
};

export const sendVerificationEmail = async (user: User): Promise<void> => {
    try {
        await sendEmailVerification(user);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Não foi possível reenviar o e-mail de verificação.");
    }
};

export const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (!user.emailVerified) {
        const notVerifiedError = new Error('Seu e-mail ainda não foi verificado.');
        (notVerifiedError as any).code = 'auth/email-not-verified';
        throw notVerifiedError;
      }
      
      // A verificação da assinatura e dos dados da organização agora é tratada de forma resiliente
      // pelo PlanContext após o login, para evitar problemas de sincronização.
      
      return user;

    } catch (error: any) {
      console.error("Error signing in:", error);
      if (error.code === 'auth/email-not-verified') {
          throw error;
      }
       if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
        const customError = new Error('E-mail ou senha inválidos. Verifique seus dados ou crie uma nova conta se a anterior foi excluída.');
        (customError as any).code = 'auth/invalid-credential';
        throw customError;
      }
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

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    try {
        await firebaseSendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
    }
}
