

'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    UserProfile,
    OrganizationProfileSchema,
    UserProfileCreationSchema,
    InviteUserSchema
} from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const createUserProfile = async (input: z.infer<typeof UserProfileCreationSchema>): Promise<{uid: string}> => {
    const { uid, name, organizationName, cnpj, contactEmail, contactPhone, email, planId, stripePriceId } = input;
    
    // Idempotency Check: if user already has an org, do nothing.
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists && userDoc.data()?.organizationId) {
        console.log(`Idempotency check: User ${uid} already belongs to an organization. Skipping profile creation.`);
        return { uid };
    }

    try {
      const orgRef = await adminDb.collection('organizations').add({
          name: organizationName,
          owner: uid,
          createdAt: FieldValue.serverTimestamp(),
          cnpj: cnpj || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          stripeCustomerId: input.stripeCustomerId || null,
          stripeSubscriptionId: input.stripeSubscriptionId || null,
          stripePriceId: stripePriceId,
          stripeSubscriptionStatus: input.stripeSubscriptionStatus || (planId === 'free' ? 'active' : 'pending'),
      });
      
      const hasPulseAccess = planId === 'performance';
  
      await userDocRef.set({
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

    } catch (error) {
      console.error("CRITICAL: Failed to create user profile and organization in Firestore transaction.", error);
      // If this fails, we have an auth user without a profile. This is a critical state.
      // Consider adding a monitoring or a cleanup process for such cases.
      throw new Error("Failed to finalize account setup.");
    }
};

export const listUsers = async (actor: string): Promise<UserProfile[]> => {
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) {
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

export const inviteUser = async (input: z.infer<typeof InviteUserSchema> & { actor: string }): Promise<{ success: boolean }> => {
    const { email, password, actor } = input;

    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) {
        throw new Error("A organização do usuário não está pronta.");
    }
    const { organizationId, planId, userRole } = adminOrgData;

    if (userRole !== 'admin') {
        throw new Error("Apenas administradores podem convidar novos usuários.");
    }

    if (planId === 'free') {
        const usersSnapshot = await adminDb.collection('users').where('organizationId', '==', organizationId).get();
        if (usersSnapshot.size >= 2) {
            throw new Error(`Você atingiu o limite de 2 usuários do plano gratuito. Faça upgrade para convidar mais.`);
        }
    }

    try {
        await adminAuth.getUserByEmail(email);
        throw new Error("Este e-mail já está em uso por outro usuário na plataforma Qoro.");
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error;
        }
    }

    const userRecord = await adminAuth.createUser({
        email,
        password,
        emailVerified: false, 
    });

    const hasPulseAccess = planId === 'performance';

    await adminDb.collection('users').doc(userRecord.uid).set({
        email: email,
        organizationId: organizationId,
        role: 'member',
        planId: planId,
        createdAt: FieldValue.serverTimestamp(),
        permissions: { 
            qoroCrm: true,
            qoroPulse: hasPulseAccess,
            qoroTask: true,
            qoroFinance: true,
        },
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { organizationId, role: 'member', planId });
    
    // O Firebase enviará automaticamente um e-mail de verificação porque emailVerified é false.
    // O usuário usará a senha temporária fornecida pelo administrador para fazer login após a verificação.

    return { success: true };
};

export const deleteUser = async (userId: string, actor: string): Promise<{ success: boolean }> => {
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) throw new Error("Aguardando sincronização do usuário.");

    const { organizationId, userRole } = adminOrgData;
    
    if (userRole !== 'admin') {
        throw new Error("Apenas administradores podem remover usuários.");
    }
    if (userId === actor) {
        throw new Error("Você não pode remover a si mesmo.");
    }
    
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || userDoc.data()?.organizationId !== organizationId) {
        throw new Error("Usuário não encontrado nesta organização.");
    }

    // First, try to delete from Firebase Auth.
    // Gracefully handle if user is already deleted from Auth.
    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log(`User with UID ${userId} not found in Firebase Auth, likely already deleted. Proceeding to delete from Firestore.`);
        } else {
            // Re-throw other auth errors
            throw error;
        }
    }
    
    // Always attempt to delete from Firestore.
    await userDocRef.delete();

    return { success: true };
};
