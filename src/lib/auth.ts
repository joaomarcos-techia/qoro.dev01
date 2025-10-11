'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  User,
  signOut as firebaseSignOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from 'firebase/auth';
import { app, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (!user.emailVerified) {
        await firebaseSignOut(auth); 
        const notVerifiedError = new Error('Seu e-mail ainda não foi verificado.');
        (notVerifiedError as any).code = 'auth/email-not-verified';
        throw notVerifiedError;
      }
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // If it's a paid plan and the subscription isn't active, block login
        if (userData?.planId !== 'free' && userData?.stripeSubscriptionStatus !== 'active') {
             await firebaseSignOut(auth);
             throw new Error('Seu pagamento está pendente. Por favor, conclua a assinatura para acessar sua conta.');
        }
      }

      return user;
    } catch (error: any) {
      console.error("Error signing in:", error);
      if (error.code === 'auth/email-not-verified' || error.message.includes('pagamento está pendente')) {
          throw error;
      }
       if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
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


export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Nenhum usuário autenticado encontrado.");
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        // Re-authenticate the user to confirm their identity
        await reauthenticateWithCredential(user, credential);
        // If re-authentication is successful, update the password
        await updatePassword(user, newPassword);
    } catch (error) {
        console.error("Error changing password:", error);
        // Provide a more specific error for wrong password
        if (error instanceof Error && (error as any).code === 'auth/wrong-password') {
            throw new Error("A senha atual está incorreta. Tente novamente.");
        }
        throw new Error("Falha ao alterar a senha. Faça o login novamente por segurança e tente de novo.");
    }
};
