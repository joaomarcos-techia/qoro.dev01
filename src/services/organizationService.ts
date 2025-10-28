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

export const inviteUser = async (input: z.infer<typeof InviteUserSchema> & { actor: string }): Promise<{ inviteId: string }> => {
    const { email, actor } = input;
  
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) {
      throw new Error("A organização do usuário não está pronta.");
    }
    const { organizationId, organizationName, planId, userRole } = adminOrgData;
  
    if (userRole !== 'admin') {
      throw new Error("Apenas administradores podem convidar novos usuários.");
    }
  
    try {
      await adminAuth.getUserByEmail(email);
      throw new Error("Este e-mail já está em uso por outro usuário na plataforma Qoro.");
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
  
    // Create an invite document instead of a user
    const inviteRef = await adminDb.collection('invites').add({
        email,
        organizationId,
        organizationName,
        planId,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: FieldValue.serverTimestamp(), // Firestore can't do future dates, but we can check on read
    });

    return { inviteId: inviteRef.id };
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

    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log(`User with UID ${userId} not found in Firebase Auth, likely already deleted. Proceeding to delete from Firestore.`);
        } else {
            throw error;
        }
    }
    
    await userDocRef.delete();

    return { success: true };
};

export const validateInvite = async (inviteId: string) => {
    const inviteRef = adminDb.collection('invites').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists || inviteDoc.data()?.status !== 'pending') {
        throw new Error("Convite inválido ou já utilizado.");
    }

    // Optional: Check expiration
    // const createdAt = inviteDoc.data()?.createdAt.toDate();
    // if (Date.now() - createdAt.getTime() > 24 * 60 * 60 * 1000) { // 24 hours
    //     await inviteRef.update({ status: 'expired' });
    //     throw new Error("Este convite expirou.");
    // }

    return {
        email: inviteDoc.data()?.email,
        organizationName: inviteDoc.data()?.organizationName,
    };
};

export const acceptInvite = async (inviteId: string, userData: { name: string, uid: string }) => {
    const inviteRef = adminDb.collection('invites').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists || inviteDoc.data()?.status !== 'pending') {
        throw new Error("Convite inválido, expirado ou já utilizado.");
    }

    const { email, organizationId, planId } = inviteDoc.data()!;
    const hasPulseAccess = planId === 'performance';
    
    await adminDb.collection('users').doc(userData.uid).set({
        name: userData.name,
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

    await adminAuth.setCustomUserClaims(userData.uid, { organizationId, role: 'member', planId });
    await inviteRef.update({ status: 'accepted', acceptedAt: FieldValue.serverTimestamp(), acceptedBy: userData.uid });

    return { success: true, organizationId };
};
