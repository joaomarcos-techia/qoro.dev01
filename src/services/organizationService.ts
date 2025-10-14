

'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    UserProfile,
    OrganizationProfileSchema,
    UserProfileCreationSchema
} from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminAuth, adminDb } from '@/lib/firebase-admin';


export const createUserProfile = async (input: z.infer<typeof UserProfileCreationSchema>): Promise<{uid: string}> => {
    const { uid, name, organizationName, cnpj, contactEmail, contactPhone, email, planId, stripePriceId } = input;
    
    // Idempotency Check: if user already has an org, do nothing.
    const existingUserDoc = await adminDb.collection('users').doc(uid).get();
    if (existingUserDoc.exists && existingUserDoc.data()?.organizationId) {
        console.log(`Idempotency check: User ${uid} already belongs to an organization. Skipping profile creation.`);
        return { uid };
    }

    const orgRef = await adminDb.collection('organizations').add({
        name: organizationName,
        owner: uid,
        createdAt: FieldValue.serverTimestamp(),
        cnpj: cnpj,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        stripeCustomerId: input.stripeCustomerId || null,
        stripeSubscriptionId: input.stripeSubscriptionId || null,
        stripePriceId: stripePriceId,
        stripeSubscriptionStatus: input.stripeSubscriptionStatus || (planId === 'free' ? 'active' : 'pending'),
    });
    
    // QoroPulse is only enabled for the 'performance' plan.
    const hasPulseAccess = planId === 'performance';

    await adminDb.collection('users').doc(uid).set({
        name: name || '',
        email: email,
        organizationId: orgRef.id,
        role: 'admin',
        planId: planId,
        stripeSubscriptionStatus: input.stripeSubscriptionStatus || (planId !== 'free' ? 'pending' : 'active'),
        createdAt: FieldValue.serverTimestamp(),
        permissions: {
            qoroCrm: true,
            qoroPulse: hasPulseAccess, 
            qoroTask: true,
            qoroFinance: true,
        },
    }, { merge: true });
    
    await adminAuth.setCustomUserClaims(uid, { organizationId: orgRef.id, role: 'admin', planId: planId });

    return { uid };
};

export const listUsers = async (actor: string): Promise<UserProfile[]> => {
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) {
        // Return empty array if user/org is not ready yet, preventing crashes.
        return [];
    }
    const { organizationId } = adminOrgData;
    
    const usersSnapshot = await adminDb.collection('users').where('organizationId', '==', organizationId).get();
    
    const users: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
        const data = doc.data();
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
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) throw new Error("Aguardando sincronização do usuário.");
    
    const { organizationId, adminUid } = adminOrgData;
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

export const getOrganizationDetails = async (actor: string): Promise<z.infer<typeof OrganizationProfileSchema> | null> => {
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) return null;
    
    const { organizationId } = adminOrgData;
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
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) throw new Error("Aguardando sincronização do usuário.");
    
    const { organizationId } = adminOrgData;
    
    const updateData: any = {};
    if(details.name) updateData.name = details.name;
    if(details.cnpj) updateData.cnpj = details.cnpj;
    if(details.contactEmail) updateData.contactEmail = details.contactEmail;
    if(details.contactPhone) updateData.contactPhone = details.contactPhone;

    await adminDb.collection('organizations').doc(organizationId).update(updateData);

    return { success: true };
};
