

'use server';
/**
 * @fileOverview Service for sending emails via Firestore Trigger Email Extension.
 */

import { adminDb } from '@/lib/firebase-admin';

interface WelcomeEmailPayload {
  email: string;
  adminName: string;
  organizationName: string;
  verificationLink: string;
}

/**
 * Sends a welcome/invitation email by creating a document in the 'mail' collection,
 * which triggers the Firebase Trigger Email extension.
 */
export const sendWelcomeEmail = async ({
  email,
  adminName,
  organizationName,
  verificationLink
}: WelcomeEmailPayload) => {
  if (!email || !adminName || !organizationName || !verificationLink) {
    throw new Error("Missing required parameters for sending a welcome email.");
  }

  const mailDocument = {
    to: email,
    template: {
      name: 'convite',
      data: {
        admin_name: adminName,
        organization_name: organizationName,
        action_url: verificationLink,
      },
    },
  };

  try {
    await adminDb.collection('mail').add(mailDocument);
    console.log(`Email document for ${email} added to Firestore 'mail' collection.`);
  } catch (error) {
    console.error("Error adding email document to Firestore:", error);
    throw new Error("Failed to queue the invitation email.");
  }
};
