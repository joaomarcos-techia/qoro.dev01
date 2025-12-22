
'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { InviteUserSchema, UpdateOrganizationDetailsSchema, UpdateUserPermissionsSchema, UserProfileCreationSchema, UserProfileSchema, OrganizationProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';

// Helper function to map Stripe Price ID to internal Plan ID
function getPlanFromPriceId(priceId: string): 'free' | 'growth' | 'performance' {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID) {
    return 'performance';
  }
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID) {
    return 'growth';
  }
  return 'free';
}

export const createUserProfile = async (input: z.infer<typeof UserProfileCreationSchema>) => {
    const {
      uid, name, email, organizationName, cnpj,
      contactEmail, contactPhone, planId, stripePriceId,
      stripeCustomerId, stripeSubscriptionId, stripeSubscriptionStatus
    } = input;
  
    const orgRef = adminDb.collection('organizations').doc();
    const userRef = adminDb.collection('users').doc(uid);
  
    // Use a transaction to ensure atomicity
    await adminDb.runTransaction(async (transaction) => {
      // 1. Create Organization
      transaction.set(orgRef, {
        name: organizationName,
        cnpj,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        adminUid: uid,
        createdAt: FieldValue.serverTimestamp(),
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
        stripePriceId: stripePriceId || null,
        stripeCurrentPeriodEnd: null,
        planId: planId,
      });
  
      // 2. Create User
      transaction.set(userRef, {
        name,
        email,
        organizationId: orgRef.id,
        role: 'admin',
        createdAt: FieldValue.serverTimestamp(),
        planId: planId,
        permissions: {
            qoroCrm: true,
            qoroPulse: planId === 'performance',
            qoroTask: true,
            qoroFinance: true,
        },
      });
    });
  
    // 3. Set Custom Claims
    await adminAuth.setCustomUserClaims(uid, { organizationId: orgRef.id, role: 'admin', planId });
  
    return { uid };
};

export const listUsers = async (actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) return [];
  
    const usersSnapshot = await adminDb.collection('users')
      .where('organizationId', '==', adminOrgData.organizationId)
      .get();
  
    if (usersSnapshot.empty) return [];
  
    return usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return UserProfileSchema.parse({
        uid: doc.id,
        email: data.email,
        name: data.name || null,
        organizationId: data.organizationId,
        role: data.role || 'member',
        permissions: data.permissions,
        planId: data.planId || 'free',
      });
    });
};
  
export const getOrganizationDetails = async (actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) return null;
  
    const orgDoc = await adminDb.collection('organizations').doc(adminOrgData.organizationId).get();
    if (!orgDoc.exists) throw new Error("Organização não encontrada.");
  
    const data = orgDoc.data()!;
    const periodEnd = data.stripeCurrentPeriodEnd?.toDate().toISOString() ?? null;
  
    return OrganizationProfileSchema.parse({
      id: orgDoc.id,
      name: data.name,
      cnpj: data.cnpj || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      stripeCustomerId: data.stripeCustomerId || null,
      stripeSubscriptionId: data.stripeSubscriptionId || null,
      stripePriceId: data.stripePriceId || null,
      stripeCurrentPeriodEnd: periodEnd,
    });
};
  
export const updateOrganizationDetails = async (input: z.infer<typeof UpdateOrganizationDetailsSchema>, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData || adminOrgData.userRole !== 'admin') {
      throw new Error("Apenas administradores podem atualizar os dados da organização.");
    }
  
    const orgRef = adminDb.collection('organizations').doc(adminOrgData.organizationId);
    await orgRef.update({
      name: input.name,
      cnpj: input.cnpj || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  
    return { success: true };
};
  
export const inviteUser = async (input: z.infer<typeof InviteUserSchema> & { actor: string }) => {
    const adminOrgData = await getAdminAndOrg(input.actor);
    if (!adminOrgData || adminOrgData.userRole !== 'admin') {
      throw new Error("Apenas administradores podem convidar usuários.");
    }
  
    const inviteRef = adminDb.collection('invites').doc();
    await inviteRef.set({
      email: input.email,
      organizationId: adminOrgData.organizationId,
      organizationName: adminOrgData.organizationName,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    });
  
    return { inviteId: inviteRef.id };
};
  
export const deleteUser = async (userId: string, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData || adminOrgData.userRole !== 'admin') {
      throw new Error("Apenas administradores podem remover usuários.");
    }
    if (userId === actorUid) {
      throw new Error("Você não pode remover a si mesmo.");
    }
  
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists || userDoc.data()?.organizationId !== adminOrgData.organizationId) {
      throw new Error("Usuário não encontrado nesta organização.");
    }
  
    await Promise.all([
      adminAuth.deleteUser(userId),
      userRef.delete()
    ]);
  
    return { success: true };
};
  
export const updateUserPermissions = async (input: z.infer<typeof UpdateUserPermissionsSchema> & { actor: string }) => {
    const adminOrgData = await getAdminAndOrg(input.actor);
    if (!adminOrgData || adminOrgData.userRole !== 'admin') {
      throw new Error("Apenas administradores podem alterar permissões.");
    }
  
    const userRef = adminDb.collection('users').doc(input.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists || userDoc.data()?.organizationId !== adminOrgData.organizationId) {
      throw new Error("Usuário não encontrado nesta organização.");
    }
  
    await userRef.update({ permissions: input.permissions });
    return { success: true };
};

export const handleSubscriptionChange = async (subscriptionId: string, priceId: string | null, status: string) => {
    const orgSnapshot = await adminDb.collection('organizations').where('stripeSubscriptionId', '==', subscriptionId).limit(1).get();
    if (orgSnapshot.empty) {
      console.warn(`[handleSubscriptionChange] No organization found for subscription ID: ${subscriptionId}`);
      return;
    }
  
    const orgDoc = orgSnapshot.docs[0];
    // If priceId is null, it's a cancellation, so the plan becomes 'free'
    const newPlanId = priceId ? getPlanFromPriceId(priceId) : 'free';
    
    let lastSystemNotification = null;
    const currentPlanId = orgDoc.data().planId;
    // Determine the final plan based on subscription status. If not active, it's free.
    const finalPlanId = (status === 'active' || status === 'trialing') ? newPlanId : 'free';

    if (status === 'active' && currentPlanId !== finalPlanId) {
        lastSystemNotification = `Seu plano foi alterado para ${finalPlanId.charAt(0).toUpperCase() + finalPlanId.slice(1)}.`;
    } else if (status !== 'active' && currentPlanId !== 'free') {
        lastSystemNotification = "Houve um problema com sua assinatura. Seu plano foi retornado para o Essencial (gratuito).";
    }

    const orgUpdateData: { [key: string]: any } = {
        planId: finalPlanId,
        stripeSubscriptionStatus: status,
        stripePriceId: priceId, // Store the latest priceId
    };

    if(lastSystemNotification) {
        orgUpdateData.lastSystemNotification = lastSystemNotification;
    }
    
    // If the plan is now free, clear the subscription-related fields
    if (finalPlanId === 'free') {
        orgUpdateData.stripeSubscriptionId = null;
        orgUpdateData.stripePriceId = null;
    }

    const batch = adminDb.batch();
    batch.update(orgDoc.ref, orgUpdateData);
  
    const usersSnapshot = await adminDb.collection('users').where('organizationId', '==', orgDoc.id).get();
    if(usersSnapshot.empty) {
        await batch.commit();
        return;
    };
    
    for (const userDoc of usersSnapshot.docs) {
      const userRef = adminDb.collection('users').doc(userDoc.id);
      const userPermissions = userDoc.data().permissions || {};

      const updatedPermissions = {
        ...userPermissions,
        qoroPulse: finalPlanId === 'performance' ? userPermissions.qoroPulse : false,
      };

      batch.update(userRef, { planId: finalPlanId, permissions: updatedPermissions });
      
      const userRecord = await adminAuth.getUser(userDoc.id);
      const currentClaims = userRecord.customClaims || {};
      await adminAuth.setCustomUserClaims(userDoc.id, { ...currentClaims, planId: finalPlanId });
    }
  
    await batch.commit();
};

export async function validateInvite(inviteId: string) {
    if (!inviteId || typeof inviteId !== 'string') {
        throw new Error('ID do convite inválido.');
    }
    const inviteRef = adminDb.collection('invites').doc(inviteId);
    const doc = await inviteRef.get();

    if (!doc.exists || doc.data()?.status !== 'pending' || doc.data()?.expiresAt.toDate() < new Date()) {
        throw new Error("Convite inválido, expirado ou já utilizado.");
    }
    const data = doc.data()!;
    return { email: data.email, organizationName: data.organizationName };
};


export async function acceptInvite(inviteId: string, input: {name: string, uid: string}) {
    const { name, uid } = input;
    if (!uid || !name) {
        throw new Error('Nome e UID do usuário são obrigatórios.');
    }

    const inviteRef = adminDb.collection('invites').doc(inviteId);
    
    return adminDb.runTransaction(async (transaction) => {
        const inviteDoc = await transaction.get(inviteRef);
        if (!inviteDoc.exists || inviteDoc.data()?.status !== 'pending') {
            throw new Error("Convite inválido ou já aceito.");
        }
        
        const inviteData = inviteDoc.data()!;
        const orgDoc = await transaction.get(adminDb.collection('organizations').doc(inviteData.organizationId));
        if (!orgDoc.exists) {
            throw new Error("Organização associada ao convite não encontrada.");
        }

        const planId = orgDoc.data()!.planId || 'free';
        const userRef = adminDb.collection('users').doc(uid);
        
        transaction.set(userRef, {
            name,
            email: inviteData.email,
            organizationId: inviteData.organizationId,
            role: 'member',
            createdAt: FieldValue.serverTimestamp(),
            planId: planId,
            permissions: {
                qoroCrm: true,
                qoroPulse: planId === 'performance',
                qoroTask: true,
                qoroFinance: true,
            },
        });

        transaction.update(inviteRef, { status: 'accepted', acceptedBy: uid, acceptedAt: FieldValue.serverTimestamp() });
        await adminAuth.setCustomUserClaims(uid, { organizationId: inviteData.organizationId, role: 'member', planId });
        
        return { success: true };
    });
};
