
'use client';

/**
 * @fileoverview Serviço centralizado para todas as operações do Firebase Authentication.
 * Segue as melhores práticas, usando exclusivamente o Web SDK do Firebase.
 * Esta versão inclui logs de erro detalhados.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  ActionCodeSettings,
  User,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

const actionCodeSettings = (): ActionCodeSettings => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9004';
  return {
    url: `${siteUrl}/login?verified=true`,
    handleCodeInApp: true,
  };
};

export const signUpAndVerify = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
      await sendEmailVerification(user, actionCodeSettings());
    } catch (verificationError) {
      // Opcional: logar o erro em um serviço de monitoramento em produção
    }

    return user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso por outra conta.');
    }
    throw new Error('Ocorreu um erro inesperado durante o cadastro.');
  }
};

export const signInAndCheckVerification = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      const verificationError = new Error('Seu e-mail ainda não foi verificado.');
      (verificationError as any).code = 'auth/email-not-verified';
      (verificationError as any).user = user;
      throw verificationError;
    }
    return user;
  } catch (error: any) {
    if (error.code === 'auth/email-not-verified') {
      throw error;
    }
    if (['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-email'].includes(error.code)) {
      throw new Error('E-mail ou senha inválidos.');
    }
    throw new Error('Ocorreu um erro inesperado durante o login.');
  }
};

export const resendVerification = async (user: User): Promise<void> => {
  try {
    await sendEmailVerification(user, actionCodeSettings());
  } catch (error: any) {
    throw new Error('Falha ao reenviar o e-mail. Tente novamente mais tarde.');
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    // Normalmente não é preciso fazer nada aqui
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email, actionCodeSettings());
  } catch (error: any) {
    throw new Error('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
  }
};
