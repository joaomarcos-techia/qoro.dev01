
'use server';
/**
 * @fileOverview Service for sending emails via the Firebase Trigger Email extension.
 */

import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const MAIL_COLLECTION = 'mail';

interface WelcomeEmailData {
  name: string;
  verificationLink: string;
}

/**
 * Sends a welcome email to a new user with a verification link.
 * This function works by creating a document in the 'mail' collection,
 * which is monitored by the "Trigger Email" Firebase Extension.
 *
 * @param to - The recipient's email address.
 * @param data - The template data, including user's name and verification link.
 */
export const sendWelcomeEmail = async (to: string, data: WelcomeEmailData): Promise<void> => {
  try {
    const mailDoc = {
      to: [to],
      template: {
        name: 'welcome', // Assumes you have a template named 'welcome' in the extension
        data: {
          name: data.name,
          verificationLink: data.verificationLink,
        },
      },
    };
    await adminDb.collection(MAIL_COLLECTION).add(mailDoc);
    console.log(`✅ Welcome email trigger document created for ${to}.`);
  } catch (error) {
    console.error('❌ Failed to create trigger document for welcome email:', error);
    // We don't re-throw the error to avoid failing the entire user creation process
    // if only the email fails. Logging is crucial here.
  }
};

/**
 * Generates an email verification link for a given user.
 *
 * @param uid - The UID of the user to generate the link for.
 * @returns The verification link.
 */
export const generateVerificationLink = async (uid: string): Promise<string> => {
    const user = await getAuth().getUser(uid);
    const email = user.email;

    if (!email) {
        throw new Error(`User with UID ${uid} does not have an email address.`);
    }

    // Generate the email verification link. You can customize the action URL.
    const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9004'}/login`, // URL to redirect to after verification
    };
    
    return getAuth().generateEmailVerificationLink(email, actionCodeSettings);
};
