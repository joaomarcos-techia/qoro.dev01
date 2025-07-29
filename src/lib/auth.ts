'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  User,
  signOut as firebaseSignOut,
  updatePassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { app } from './firebase';

const auth = getAuth(app);
const db = getFirestore(app);

export const signUp = async (name: string, organizationName: string, email: string, password: string, cnpj: string, contactEmail: string, contactPhone: string): Promise<User> => {
  try {
    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Create the organization document in Firestore
    const orgRef = await addDoc(collection(db, 'organizations'), {
        name: organizationName,
        owner: user.uid,
        createdAt: new Date(),
        cnpj: cnpj || '',
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || '',
    });

    // 3. Create the user document in Firestore and link to the organization
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      organizationId: orgRef.id, // Link to the new organization
      createdAt: new Date(),
      // The creator of the org is an admin by default
      role: 'admin',
      permissions: {
        qoroCrm: true,
        qoroPulse: true,
        qoroTask: true,
        qoroFinance: true,
      }
    });

    // 4. Send email verification
    await sendEmailVerification(user);

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
