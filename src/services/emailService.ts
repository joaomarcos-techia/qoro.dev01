
'use server';
/**
 * @fileOverview Service for sending authentication-related emails
 * via the Firebase Trigger Email extension.
 */

// This file is no longer needed as email verification is now handled
// on the client-side using the standard Firebase Auth SDK.
// It is kept here to avoid breaking imports, but its functions are empty.

/**
 * @deprecated This function is deprecated. Email verification is now handled on the client-side.
 */
export const sendWelcomeEmail = async (
  to: string,
  uid: string,
  data: any
): Promise<void> => {
  console.warn("sendWelcomeEmail is deprecated and should not be used.");
  // No-op
};
