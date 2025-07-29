
'use server';
/**
 * @fileOverview User and organization management flows.
 * - signUp - Creates a new user and organization.
 * - inviteUser - Invites a user to an organization via email.
 * - listUsers - Lists all users within the caller's organization.
 * - updateUserPermissions - Updates the application permissions for a specific user.
 * - getOrganizationDetails - Fetches details for the user's organization.
 * - updateOrganizationDetails - Updates details for the user's organization.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const app = getApps().length
  ? (getApps()[0] as App)
  : initializeApp();

const auth = getAuth(app);
const db = getFirestore(app);

const getAdminAndOrg = async (actorUid: string | undefined) => {
    if (!actorUid) {
        throw new Error('Usuário precisa estar autenticado.');
    }
    const adminDocRef = db.collection('users').doc(actorUid);
    const adminDoc = await adminDocRef.get();
    if (!adminDoc.exists) {
        throw new Error('Usuário administrador não encontrado no Firestore.');
    }
    const adminData = adminDoc.data()!;
    const organizationId = adminData.organizationId;
    if (!organizationId) {
        throw new Error('Usuário administrador não pertence a uma organização.');
    }
    
    // Check role
    const role = adminData.role;
    if (role !== 'admin') {
        throw new Error('Usuário não tem privilégios de administrador.');
    }

    return { adminDoc, organizationId };
}

// Schemas
export const SignUpSchema = z.object({
    name: z.string(),
    organizationName: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    cnpj: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
});

export const InviteUserSchema = z.object({
  email: z.string().email(),
});

const AppPermissionsSchema = z.object({
    qoroCrm: z.boolean().default(true),
    qoroPulse: z.boolean().default(true),
    qoroTask: z.boolean().default(true),
    qoroFinance: z.boolean().default(true),
}).optional();

export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string(),
    name: z.string().optional().nullable(),
    organizationId: z.string(),
    role: z.string().optional(),
    permissions: AppPermissionsSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateUserPermissionsSchema = z.object({
    userId: z.string(),
    permissions: z.object({
        qoroCrm: z.boolean(),
        qoroPulse: z.boolean(),
        qoroTask: z.boolean(),
        qoroFinance: z.boolean(),
    }),
});

export const OrganizationProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    cnpj: z.string().optional().nullable(),
    contactEmail: z.string().email().optional().nullable(),
    contactPhone: z.string().optional().nullable(),
});
export type OrganizationProfile = z.infer<typeof OrganizationProfileSchema>;

export const UpdateOrganizationDetailsSchema = z.object({
    name: z.string(),
    cnpj: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
});


// Exported functions (client-callable wrappers)
export async function signUp(input: z.infer<typeof SignUpSchema>) {
    return signUpFlow(input);
}

export async function inviteUser(input: z.infer<typeof InviteUserSchema>) {
    return inviteUserFlow(input);
}

export async function listUsers() {
    return listUsersFlow();
}

export async function updateUserPermissions(input: z.infer<typeof UpdateUserPermissionsSchema>) {
    return updateUserPermissionsFlow(input);
}

export async function getOrganizationDetails() {
    return getOrganizationDetailsFlow();
}

export async function updateOrganizationDetails(input: z.infer<typeof UpdateOrganizationDetailsSchema>) {
    return updateOrganizationDetailsFlow(input);
}


// Genkit Flows
export const signUpFlow = ai.defineFlow(
    {
        name: 'signUpFlow',
        inputSchema: SignUpSchema,
        outputSchema: z.object({ uid: z.string() }),
    },
    async ({ name, organizationName, email, password, cnpj, contactEmail, contactPhone }) => {
        // 1. Create user in Firebase Auth FIRST. This is the critical step.
        // If this fails (e.g., email already exists), the flow stops before creating any documents.
        const userRecord = await auth.createUser({
            email,
            password,
            emailVerified: false, // Start as unverified
        });

        // 2. If user creation is successful, create organization in Firestore
        const orgRef = await db.collection('organizations').add({
            name: organizationName,
            owner: userRecord.uid,
            createdAt: FieldValue.serverTimestamp(),
            cnpj: cnpj || null,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
        });

        // 3. Create user profile in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            organizationId: orgRef.id,
            role: 'admin',
            createdAt: FieldValue.serverTimestamp(),
            permissions: {
                qoroCrm: true,
                qoroPulse: true,
                qoroTask: true,
                qoroFinance: true,
            },
        });

        // 4. Send verification email
        const verificationLink = await auth.generateEmailVerificationLink(email);
        // In a real app, you would use a service to email the link.
        console.log(`Verification link for ${email}: ${verificationLink}`);

        return { uid: userRecord.uid };
    }
);

export const inviteUserFlow = ai.defineFlow(
  {
    name: 'inviteUserFlow',
    inputSchema: InviteUserSchema,
    outputSchema: z.object({
      uid: z.string(),
      email: z.string(),
      organizationId: z.string(),
    }),
  },
  async ({ email }, context) => {
    const { organizationId } = await getAdminAndOrg(context?.auth?.uid);
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      emailVerified: false,
    });

    // Save user info to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      organizationId,
      invitedBy: context?.auth?.uid,
      createdAt: FieldValue.serverTimestamp(),
      role: 'member', // Default role for invited users
      permissions: {
        qoroCrm: true,
        qoroPulse: true,
        qoroTask: true,
        qoroFinance: true,
      }
    });

    // Send a password reset email to act as a "set your password" link
    const link = await auth.generatePasswordResetLink(email);
    // In a real app, you would email this link. For now, log it.
    console.log(`Password setup link for ${email}: ${link}`);

    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      organizationId,
    };
  }
);


export const listUsersFlow = ai.defineFlow(
    {
        name: 'listUsersFlow',
        inputSchema: z.undefined(),
        outputSchema: z.array(UserProfileSchema),
    },
    async (_, context) => {
        const { organizationId } = await getAdminAndOrg(context?.auth?.uid);

        const usersSnapshot = await db.collection('users').where('organizationId', '==', organizationId).get();
        
        const users: UserProfile[] = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            users.push({
                uid: doc.id,
                email: data.email,
                name: data.name,
                organizationId: data.organizationId,
                role: data.role,
                permissions: data.permissions,
            });
        });
        
        return users;
    }
);


export const updateUserPermissionsFlow = ai.defineFlow(
    {
        name: 'updateUserPermissionsFlow',
        inputSchema: UpdateUserPermissionsSchema,
        outputSchema: z.object({ success: z.boolean() }),
    },
    async ({ userId, permissions }, context) => {
        const { organizationId, adminDoc } = await getAdminAndOrg(context?.auth?.uid);
        
        const targetUserRef = db.collection('users').doc(userId);
        const targetUserDoc = await targetUserRef.get();

        if (!targetUserDoc.exists || targetUserDoc.data()?.organizationId !== organizationId) {
            throw new Error("Usuário alvo não encontrado nesta organização.");
        }

        // Prevent admin from changing their own permissions to avoid lockout
        if (adminDoc.id === userId) {
            throw new Error("Administradores não podem alterar as próprias permissões.");
        }

        await targetUserRef.update({ permissions });

        return { success: true };
    }
);

export const getOrganizationDetailsFlow = ai.defineFlow(
    {
        name: 'getOrganizationDetailsFlow',
        inputSchema: z.undefined(),
        outputSchema: OrganizationProfileSchema,
    },
    async (_, context) => {
        const { organizationId } = await getAdminAndOrg(context?.auth?.uid);
        const orgDoc = await db.collection('organizations').doc(organizationId).get();

        if (!orgDoc.exists) {
            throw new Error('Organização não encontrada.');
        }
        const orgData = orgDoc.data()!;
        return {
            id: orgDoc.id,
            name: orgData.name,
            cnpj: orgData.cnpj,
            contactEmail: orgData.contactEmail,
            contactPhone: orgData.contactPhone,
        };
    }
);

export const updateOrganizationDetailsFlow = ai.defineFlow(
    {
        name: 'updateOrganizationDetailsFlow',
        inputSchema: UpdateOrganizationDetailsSchema,
        outputSchema: z.object({ success: z.boolean() }),
    },
    async (details, context) => {
        const { organizationId } = await getAdminAndOrg(context?.auth?.uid);
        
        const updateData = {
            name: details.name,
            cnpj: details.cnpj || null,
            contactEmail: details.contactEmail || null,
            contactPhone: details.contactPhone || null,
        };

        await db.collection('organizations').doc(organizationId).update(updateData);

        return { success: true };
    }
);
