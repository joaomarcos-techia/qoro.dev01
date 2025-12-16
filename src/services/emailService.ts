
'use server';
/**
 * @fileOverview Service for handling email-related operations using the Firebase Admin SDK
 * and the Trigger Email extension.
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Generates an official Firebase email verification link.
 * This link can be sent to the user to verify their email address.
 * @param uid - The user's unique ID (UID) from Firebase Authentication.
 * @returns A promise that resolves with the verification link string.
 */
async function generateEmailVerificationLink(uid: string): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9004';
  const actionCodeSettings = {
    url: `${siteUrl}/login?verified=true`, // Redirect after verification
    handleCodeInApp: false,
  };

  try {
    const user = await adminAuth.getUser(uid);
    if (!user.email) {
      throw new Error('Usuário não possui um e-mail para verificação.');
    }
    const link = await adminAuth.generateEmailVerificationLink(user.email, actionCodeSettings);
    return link;
  } catch (error: any) {
    console.error('Erro ao gerar o link de verificação de e-mail:', error);
    // Throw a more user-friendly error to be caught by the calling function.
    throw new Error('Não foi possível gerar o link de verificação.');
  }
}

/**
 * Creates a document in the 'mail' collection to trigger the "Trigger Email" extension.
 * This sends a pre-defined template from Firestore to the specified user.
 * @param uid - The UID of the user to send the email to.
 * @param name - The name of the user, to be used in the email template.
 */
export async function sendVerificationEmail(uid: string, name: string): Promise<void> {
  try {
    const user = await adminAuth.getUser(uid);
    if (!user.email) {
        console.warn(`Tentativa de enviar e-mail de verificação para o usuário ${uid}, que não possui e-mail.`);
        return;
    }

    const verificationLink = await generateEmailVerificationLink(uid);

    // This document will be picked up by the Firebase Trigger Email extension.
    await adminDb.collection('mail').add({
      to: [user.email],
      template: {
        name: 'email-verification', // The EXACT name of the template document in the 'templates' collection.
        data: {
          name: name,
          verificationLink: verificationLink,
        },
      },
    });
    console.log(`E-mail de verificação solicitado para ${user.email}`);
  } catch (error: any) {
    // We log the error but don't re-throw it to prevent the user creation process from failing.
    // The user can request a new verification email from the login page.
    console.error('CRITICAL: Falha ao acionar o envio do e-mail de verificação no back-end:', error);
  }
}
