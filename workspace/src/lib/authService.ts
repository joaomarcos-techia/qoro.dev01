
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
import { app } from './firebase';

const auth = getAuth(app);

/**
 * Configurações para os links de ação de e-mail (verificação, redefinição de senha).
 * Redireciona o usuário para a página de login após a ação ser concluída.
 */
const actionCodeSettings = (): ActionCodeSettings => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9004';
    return {
        url: `${siteUrl}/login?verified=true`,
        handleCodeInApp: false, // O link será aberto no navegador
    };
};

/**
 * Registra um novo usuário e dispara o e-mail de verificação padrão do Firebase.
 * @param email O e-mail do usuário.
 * @param password A senha do usuário.
 * @returns O objeto User criado.
 */
export const signUpAndVerify = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Dispara o e-mail de verificação padrão do Firebase.
    await sendEmailVerification(user, actionCodeSettings());
    
    return user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso por outra conta.');
    }
    console.error("Erro no cadastro:", error);
    throw new Error('Ocorreu um erro inesperado durante o cadastro. Tente novamente.');
  }
};

/**
 * Realiza o login de um usuário e verifica se o e-mail foi confirmado.
 * Se o e-mail não for verificado, lança um erro específico.
 * @param email O e-mail do usuário.
 * @param password A senha do usuário.
 * @returns O objeto User autenticado.
 */
export const signInAndCheckVerification = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            // Lança um erro customizado que a UI pode capturar para mostrar a opção de reenvio.
            const verificationError = new Error('Seu e-mail ainda não foi verificado.');
            (verificationError as any).code = 'auth/email-not-verified';
            (verificationError as any).user = user; // Anexa o usuário ao erro para o reenvio.
            throw verificationError;
        }

        return user;
    } catch (error: any) {
        if (error.code === 'auth/email-not-verified') {
            throw error; // Propaga o erro de verificação.
        }
        if (['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-email'].includes(error.code)) {
            throw new Error('E-mail ou senha inválidos.');
        }
        console.error("Erro no login:", error);
        throw new Error('Ocorreu um erro inesperado durante o login.');
    }
};

/**
 * Reenvia o e-mail de verificação para o usuário fornecido.
 * @param user O objeto User para o qual o e-mail será reenviado.
 */
export const resendVerification = async (user: User): Promise<void> => {
    try {
        await sendEmailVerification(user, actionCodeSettings());
    } catch (error: any) {
        console.error("Erro ao reenviar e-mail de verificação:", error);
        throw new Error('Falha ao reenviar o e-mail. Tente fazer login novamente para tentar de novo.');
    }
};

/**
 * Realiza o logout do usuário.
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    // Normalmente, não é necessário lançar um erro aqui, pois o logout deve ser uma operação segura.
  }
};

/**
 * Envia um e-mail de redefinição de senha.
 * @param email O e-mail do usuário.
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    try {
        await firebaseSendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Erro ao enviar e-mail de redefinição de senha:", error);
        throw new Error("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
    }
};
