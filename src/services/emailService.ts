'use server';
/**
 * @fileOverview Service for sending authentication-related emails
 * via the Firebase Trigger Email extension.
 */

import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const MAIL_COLLECTION = 'mail';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface WelcomeTemplateData {
  name: string;
  // O link de verificação será gerado pela própria extensão
  // Nós apenas precisamos garantir que o template no Firestore o utilize.
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Sends a welcome and verification email to a new user.
 * This creates a document in the "mail" collection with an action link,
 * which is consumed by the Firebase Trigger Email extension.
 */
export const sendWelcomeEmail = async (
  to: string,
  uid: string,
  data: WelcomeTemplateData
): Promise<void> => {
  try {
    // A extensão "Trigger Email" gerará o link de verificação automaticamente
    // quando o campo `template.data.uid` estiver presente e o e-mail do usuário
    // no Firebase Auth não estiver verificado.
    await adminDb.collection(MAIL_COLLECTION).add({
      to: [to],
      template: {
        name: 'welcome', // O nome do seu template no Firestore
        data: {
          name: data.name,
          uid: uid, // A extensão usa isso para criar o link de verificação
        },
      },
    });

    console.log(`✅ Welcome/Verification email queued for ${to} via Trigger Email extension.`);
  } catch (error) {
    console.error('❌ Failed to queue welcome email:', error);
    // Não quebramos o fluxo principal por falha de e-mail, mas registramos o erro.
  }
};
