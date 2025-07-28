'use server';
/**
 * @fileOverview User management flows for inviting users.
 * - inviteUser - Invites a user to an organization via email.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// We need to use the Firebase Admin SDK for user creation on the backend.
// This requires service account credentials. For App Hosting, these are
// automatically available in the environment.
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onFlow } from 'genkit/next';

// Initialize Firebase Admin SDK
const app = getApps().length
  ? (getApps()[0] as App)
  : initializeApp();

const auth = getAuth(app);
const db = getFirestore(app);

export const InviteUserSchema = z.object({
  email: z.string().email(),
});

export async function inviteUser(input: z.infer<typeof InviteUserSchema>) {
    return inviteUserFlow(input);
}

export const inviteUserFlow = ai.defineFlow(
  {
    name: 'inviteUserFlow',
    inputSchema: InviteUserSchema,
    outputSchema: z.object({
      uid: z.string(),
      email: z.string(),
      organization: z.string(),
    }),
  },
  async ({ email }, context) => {
    const actorUid = context?.auth?.uid;
    if (!actorUid) {
      throw new Error('User must be authenticated to invite others.');
    }

    // 1. Get the admin's organization
    const adminDocRef = db.collection('users').doc(actorUid);
    const adminDoc = await adminDocRef.get();
    if (!adminDoc.exists) {
      throw new Error('Admin user not found in Firestore.');
    }
    const organization = adminDoc.data()?.organization;
    if (!organization) {
      throw new Error('Admin user does not have an organization.');
    }

    // 2. Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      emailVerified: false, // User needs to verify
    });

    // 3. Save user info to Firestore, linking to the organization
    await db.collection('users').doc(userRecord.uid).set({
      email,
      organization,
      invitedBy: actorUid,
      createdAt: new Date(),
      // Name will be added by the user themselves later
    });

    // 4. Send a password reset email, which acts as a "set your password" link
    const link = await auth.generatePasswordResetLink(email);
    
    // Here you would typically use a proper email service (e.g., SendGrid, Mailgun)
    // For this example, we'll just log the link. In a real app, this part
    // would be replaced by an actual email-sending API call.
    console.log(`Password setup link for ${email}: ${link}`);


    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      organization,
    };
  }
);
