

'use server';

import { FieldValue } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import { z } from 'zod';
import { 
    SignUpSchema, 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    UserProfile,
    OrganizationProfileSchema 
} from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Refactored signUp to only handle Firestore document creation, not Auth user creation.
// The user should be created on the client-side first to handle email verification.
const ServerSignUpSchema = SignUpSchema.extend({
    uid: z.string(),
    planId: z.string(),
});

export const signUp = async (input: z.infer<typeof ServerSignUpSchema>): Promise<{uid: string}> => {
    const { uid, name, organizationName, cnpj, contactEmail, contactPhone, email, planId } = input;
    
    // Check if user already has an organization
    const existingUserDoc = await adminDb.collection('users').doc(uid).get();
    if (existingUserDoc.exists && existingUserDoc.data()?.organizationId) {
        throw new Error("Este usuário já pertence a uma organização.");
    }

    // For free plan, create org and user doc immediately.
    // For paid plans, this function will be called by the webhook after payment.
    if (planId === 'free') {
        const orgRef = await adminDb.collection('organizations').add({
            name: organizationName,
            owner: uid,
            createdAt: FieldValue.serverTimestamp(),
            cnpj: cnpj,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            stripePriceId: 'free', // Mark as free plan
        });
    
        await adminDb.collection('users').doc(uid).set({
            name: name || '',
            email: email, // Storing email for reference
            organizationId: orgRef.id,
            role: 'admin',
            planId: 'free',
            createdAt: FieldValue.serverTimestamp(),
            permissions: {
                qoroCrm: true,
                qoroPulse: false, // Pulse is not on free plan
                qoroTask: true,
                qoroFinance: true,
            },
        });
        
        await adminAuth.setCustomUserClaims(uid, { organizationId: orgRef.id, role: 'admin', planId: 'free' });
    } else {
        // For paid plans, just create a user record with a pending status.
        // The webhook will create the organization and update the user record.
        await adminDb.collection('users').doc(uid).set({
            name: name || '',
            email: email,
            planId: planId, // e.g., 'growth' or 'performance'
            role: 'admin', // Tentative role
            createdAt: FieldValue.serverTimestamp(),
            // No organizationId yet, no full permissions
        });
         await adminAuth.setCustomUserClaims(uid, { role: 'admin', planId: planId }); // No orgId yet
    }

    return { uid };
};

export const inviteUser = async (email: string, actor: string): Promise<{ uid: string; email: string; organizationId: string; }> => {
    const { organizationId, adminUid, planId } = await getAdminAndOrg(actor);

    if (planId === 'free') {
        const usersSnapshot = await adminDb.collection('users').where('organizationId', '==', organizationId).get();
        if (usersSnapshot.size >= 2) {
            throw new Error('O plano gratuito permite apenas 2 usuários. Faça upgrade para convidar mais membros.');
        }
    }
    
    let userRecord: UserRecord;
    try {
        userRecord = await adminAuth.createUser({
            email,
            emailVerified: false,
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este usuário já existe no sistema.');
        }
        throw error;
    }


    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      organizationId,
      invitedBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
      role: 'member',
      permissions: {
        qoroCrm: true,
        qoroPulse: true,
        qoroTask: true,
        qoroFinance: true,
      }
    });
    
    // Set custom claims for security rules if needed
    await adminAuth.setCustomUserClaims(userRecord.uid, { organizationId: organizationId, role: 'member' });

    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      organizationId,
    };
};

export const listUsers = async (actor: string): Promise<UserProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actor);
    
    const usersSnapshot = await adminDb.collection('users').where('organizationId', '==', organizationId).get();
    
    const users: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        // Define default permissions and merge them with existing ones to avoid errors
        const defaultPermissions = { qoroCrm: true, qoroPulse: true, qoroTask: true, qoroFinance: true };
        const userPermissions = data.permissions || {};

        users.push({
            uid: doc.id,
            email: data.email,
            name: data.name,
            organizationId: data.organizationId,
            role: data.role,
            planId: data.planId || 'free',
            permissions: { ...defaultPermissions, ...userPermissions },
        });
    });
    
    return users;
};

export const updateUserPermissions = async (input: z.infer<typeof UpdateUserPermissionsSchema>, actor: string): Promise<{ success: boolean }> => {
    const { organizationId, adminUid } = await getAdminAndOrg(actor);
    const { userId, permissions } = input;

    if (adminUid === userId) {
        throw new Error("Administradores não podem alterar as próprias permissões.");
    }
    
    const targetUserRef = adminDb.collection('users').doc(userId);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists || targetUserDoc.data()?.organizationId !== organizationId) {
        throw new Error("Usuário alvo não encontrado nesta organização.");
    }

    await targetUserRef.update({ permissions });

    return { success: true };
};

export const getOrganizationDetails = async (actor: string): Promise<z.infer<typeof OrganizationProfileSchema>> => {
    const { organizationId } = await getAdminAndOrg(actor);
    const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();

    if (!orgDoc.exists) {
        throw new Error('Organização não encontrada.');
    }
    const orgData = orgDoc.data()!;
    
    const stripeCurrentPeriodEnd = orgData.stripeCurrentPeriodEnd?.toDate 
        ? orgData.stripeCurrentPeriodEnd.toDate().toISOString()
        : null;

    const profileData = {
        id: orgDoc.id,
        name: orgData.name,
        cnpj: orgData.cnpj,
        contactEmail: orgData.contactEmail,
        contactPhone: orgData.contactPhone,
        stripeCustomerId: orgData.stripeCustomerId,
        stripeSubscriptionId: orgData.stripeSubscriptionId,
        stripePriceId: orgData.stripePriceId,
        stripeCurrentPeriodEnd: stripeCurrentPeriodEnd,
    };

    return OrganizationProfileSchema.parse(profileData);
};

export const updateOrganizationDetails = async (details: z.infer<typeof UpdateOrganizationDetailsSchema>, actor: string): Promise<{ success: boolean }> => {
    const { organizationId } = await getAdminAndOrg(actor);
    
    const updateData: any = {};
    if(details.name) updateData.name = details.name;
    if(details.cnpj) updateData.cnpj = details.cnpj;
    if(details.contactEmail) updateData.contactEmail = details.contactEmail;
    if(details.contactPhone) updateData.contactPhone = details.contactPhone;

    await adminDb.collection('organizations').doc(organizationId).update(updateData);

    return { success: true };
};
