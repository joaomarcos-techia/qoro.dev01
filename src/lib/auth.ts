
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
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const organizationId = userData.organizationId;

        if (!organizationId) {
             throw new Error('Dados da organização não encontrados. A sincronização da conta pode estar pendente.');
        }

        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
            await firebaseSignOut(auth);
            throw new Error('A organização associada a esta conta não foi encontrada. Entre em contato com o suporte.');
        }
        
        const orgData = orgDoc.data();
        const planId = orgData.stripePriceId === process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID ? 'performance' :
                       orgData.stripePriceId === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID ? 'growth' : 'free';

        // If it's a paid plan and the subscription isn't active, block login
        if (planId !== 'free' && orgData.stripeSubscriptionStatus !== 'active') {
             await firebaseSignOut(auth);
             throw new Error('A assinatura da sua organização não está ativa. Por favor, peça ao administrador para verificar o pagamento.');
        }
      } else {
        // If user document doesn't exist, it's a sync issue. Let the polling on login page handle it.
        // Don't sign out here, as the polling needs the authenticated user.
        throw new Error('Os dados da sua conta ainda não foram sincronizados. Por favor, aguarde alguns minutos e tente novamente.');
      }

      return user;
    } catch (error: any) {
      console.error("Error signing in:", error);
      if (error.code === 'auth/email-not-verified' || error.message.includes('A assinatura') || error.message.includes('não foram sincronizados') || error.message.includes('Dados da organização')) {
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
