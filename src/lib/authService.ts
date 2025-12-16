
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

export const signUpAndVerify = async (email: string, password: string): Promise<User> => {
  console.log('[AuthService] Iniciando signUpAndVerify para:', email);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('[AuthService] Usuário criado com sucesso, UID:', user.uid);

    try {
      // Simplificado: Usa o fluxo padrão do Firebase, que é mais robusto.
      await sendEmailVerification(user);
      console.log('[AuthService] E-mail de verificação solicitado com sucesso para:', email);
    } catch (verificationError) {
      console.error('❌ [AuthService] ERRO CRÍTICO ao enviar e-mail de verificação:', verificationError);
      // Não relança o erro para não quebrar a experiência de cadastro, mas o log é vital.
    }

    return user;
  } catch (error: any) {
    console.error('❌ [AuthService] ERRO em createUserWithEmailAndPassword:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso por outra conta.');
    }
    throw new Error('Ocorreu um erro inesperado durante o cadastro. Verifique o console.');
  }
};

export const signInAndCheckVerification = async (email: string, password: string): Promise<User> => {
  console.log('[AuthService] Iniciando signInAndCheckVerification para:', email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('[AuthService] Login bem-sucedido para:', email);

    if (!user.emailVerified) {
      console.warn('[AuthService] E-mail não verificado para:', email);
      const verificationError = new Error('Seu e-mail ainda não foi verificado.');
      (verificationError as any).code = 'auth/email-not-verified';
      (verificationError as any).user = user;
      throw verificationError;
    }
    console.log('[AuthService] E-mail verificado para:', email);
    return user;
  } catch (error: any) {
    console.error('❌ [AuthService] ERRO em signInWithEmailAndPassword:', error);
    if (error.code === 'auth/email-not-verified') {
      throw error;
    }
    if (['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-email'].includes(error.code)) {
      throw new Error('E-mail ou senha inválidos.');
    }
    throw new Error('Ocorreu um erro inesperado durante o login. Verifique o console.');
  }
};

export const resendVerification = async (user: User): Promise<void> => {
  console.log('[AuthService] Solicitando reenvio de verificação para:', user.email);
  try {
    // Simplificado: Usa o fluxo padrão do Firebase.
    await sendEmailVerification(user);
    console.log('[AuthService] Reenvio de e-mail de verificação solicitado com sucesso.');
  } catch (error: any) {
    console.error('❌ [AuthService] ERRO ao reenviar e-mail de verificação:', error);
    throw new Error('Falha ao reenviar o e-mail. Verifique o console e tente novamente.');
  }
};

export const signOut = async (): Promise<void> => {
  console.log('[AuthService] Executando signOut.');
  try {
    await firebaseSignOut(auth);
    console.log('[AuthService] Logout bem-sucedido.');
  } catch (error: any) {
    console.error('❌ [AuthService] ERRO ao fazer logout:', error);
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  console.log('[AuthService] Solicitando redefinição de senha para:', email);
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    console.log('[AuthService] E-mail de redefinição de senha enviado com sucesso.');
  } catch (error: any) {
    console.error('❌ [AuthService] ERRO ao enviar e-mail de redefinição de senha:', error);
    throw new Error('Não foi possível enviar o e-mail. Verifique o endereço e o console.');
  }
};
