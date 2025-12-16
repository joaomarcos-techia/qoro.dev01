
'use client';

/**
 * @fileoverview Serviço centralizado para todas as operações do Firebase Authentication.
 * Segue as melhores práticas, usando exclusivamente o Web SDK do Firebase.
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  ActionCodeSettings,
  User,
} from 'firebase/auth';

import { app } from '@/lib/firebase';

// Obtenha a instância de autenticação aqui, dentro do escopo do cliente.
const auth = getAuth(app);

/**
 * Configurações para os links de ação de e-mail (verificação, redefinição de senha).
 * Redireciona o usuário para a página de login após a ação ser concluída.
 */
const actionCodeSettings = (): ActionCodeSettings => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9004';
  return {
    url: `${siteUrl}/login?verified=true`,
    handleCodeInApp: false,
  };
};

/**
 * Registra um novo usuário e dispara o e-mail de verificação padrão do Firebase.
 */
export const signUpAndVerify = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await sendEmailVerification(user, actionCodeSettings());

    return user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso por outra conta.');
    }
    console.error('Erro no cadastro:', error);
    throw new Error('Ocorreu um erro inesperado durante o cadastro. Tente novamente.');
  }
};

/**
 * Realiza o login de um usuário e verifica se o e-mail foi confirmado.
 */
export const signInAndCheckVerification = async (
  email: string,
  password: string
): Promise<User> => {
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
    if (
      ['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-email'].includes(
        error.code
      )
    ) {
      throw new Error('E-mail ou senha inválidos.');
    }
    console.error('Erro no login:', error);
    throw new Error('Ocorreu um erro inesperado durante o login.');
  }
};

/**
 * Reenvia o e-mail de verificação para o usuário fornecido.
 */
export const resendVerification = async (user: User): Promise<void> => {
    // Rate limiting para reenvio de email
    const RESEND_COOLDOWN = 60000; // 1 minuto
    let lastResendTime = 0;
    const now = Date.now();
  
    // Verifica cooldown
    if (now - lastResendTime < RESEND_COOLDOWN) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN - (now - lastResendTime)) / 1000);
        throw new Error(`Aguarde ${remainingSeconds} segundos antes de reenviar.`);
    }

  try {
    await sendEmailVerification(user, actionCodeSettings());
    lastResendTime = now;
  } catch (error: any) {
    console.error('Erro ao reenviar e-mail de verificação:', error);
    throw new Error('Falha ao reenviar o e-mail. Tente fazer login novamente.');
  }
};

/**
 * Realiza o logout do usuário.
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};

/**
 * Envia um e-mail de redefinição de senha.
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição de senha:', error);
    throw new Error('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
  }
};
