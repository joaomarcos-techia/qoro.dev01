
'use server';
/**
 * @fileOverview Service for sending authentication-related emails
 * via the Firebase Trigger Email extension.
 */

import { adminDb } from '@/lib/firebase-admin';

const MAIL_COLLECTION = 'mail';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface WelcomeTemplateData {
  name: string;
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
    // The "Trigger Email" extension will automatically generate the verification link
    // when the `uid` field is present in the template data and the user's email
    // in Firebase Auth is not yet verified. The template name here MUST match
    // the document ID in your `templates` collection in Firestore.
    await adminDb.collection(MAIL_COLLECTION).add({
      to: [to],
      template: {
        name: 'email-verification', // Corrected template name
        data: {
          name: data.name,
          uid: uid, // The extension uses this to create the verification link
        },
      },
    });

    console.log(`✅ Welcome/Verification email queued for ${to} via Trigger Email extension.`);
  } catch (error) {
    console.error('❌ Failed to queue welcome email:', error);
    // Do not break the main flow for email failure, but log the error.
  }
};
