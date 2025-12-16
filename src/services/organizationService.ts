
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    UserProfile,
    OrganizationProfileSchema,
    UserProfileCreationSchema,
    InviteUserSchema,
    AppPermissions
} from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const FREE_PLAN_USER_LIMIT = 2;
const GROWTH_PLAN_USER_LIMIT = 5;

const getLostFeaturesMessage = (fromPlan: string, toPlan: string): string | null => {
    const features: Record<string, string[]> = {
        performance: ['QoroPulse (IA)', 'Orçamentos', 'Conciliação Bancária', 'Gestão de Fornecedores'],
        growth: ['Produtos e Serviços', 'Quadro Kanban', 'Calendário de Tarefas', 'Contas a Pagar/Receber'],
    };

    let lostFeatures: string[] = [];
    if (fromPlan === 'performance' && toPlan === 'growth') {
        lostFeatures = features.performance;
    } else if (fromPlan === 'performance' && toPlan === 'free') {
        lostFeatures = [...features.performance, ...features.growth];
    } else if (fromPlan === 'growth' && toPlan === 'free') {
        lostFeatures = features.growth;
    }

    if (lostFeatures.length > 0) {
        let message = `Você fez o downgrade para o plano ${toPlan.charAt(0).toUpperCase() + toPlan.slice(1)}. As seguintes funcionalidades não estão mais disponíveis: ${lostFeatures.join(', ')}.`;
        if (toPlan === 'free') {
            message += " Além disso, foram aplicados limites de registros.";
        }
        return message;
    }

    return null;
}

const getGainedFeaturesMessage = (fromPlan: string, toPlan: string): string | null => {
    const features: Record<string, string[]> = {
        performance: ['QoroPulse (IA)', 'Orçamentos', 'Conciliação Bancária', 'Gestão de Fornecedores'],
        growth: ['Produtos e Serviços', 'Quadro Kanban', 'Calendário de Tarefas', 'Contas a Pagar/Receber'],
    };

    let gainedFeatures: string[] = [];
    if (fromPlan === 'free' && toPlan === 'growth') {
        gainedFeatures = features.growth;
    } else if (fromPlan === 'free' && toPlan === 'performance') {
        gainedFeatures = [...features.growth, ...features.performance];
    } else if (fromPlan === 'growth' && toPlan === 'performance') {
        gainedFeatures = features.performance;
    }

    if (gainedFeatures.length > 0) {
        return `Parabéns pelo upgrade para o plano ${toPlan.charAt(0).toUpperCase() + toPlan.slice(1)}! Você desbloqueou: ${gainedFeatures.join(', ')}.`;
    }

    return null;
}


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

    const usersInOrg = await listUsers(actor);
    const userCount = usersInOrg.length;

    if (planId === 'free' && userCount >= FREE_PLAN_USER_LIMIT) {
        throw new Error(`Limite de ${FREE_PLAN_USER_LIMIT} usuários atingido para o plano gratuito.`);
    }
    if (planId === 'growth' && userCount >= GROWTH_PLAN_USER_LIMIT) {
        throw new Error(`Limite de ${GROWTH_PLAN_USER_LIMIT} usuários atingido para o plano Growth.`);
    }
  
    try {
      await adminAuth.getUserByEmail(email);
      throw new Error("Este e-mail já está em uso por outro usuário na plataforma Qoro.");
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
  
    const inviteRef = await adminDb.collection('invites').add({
        email,
        organizationId,
        organizationName,
        planId,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
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

export const updateUserPermissions = async (input: z.infer<typeof UpdateUserPermissionsSchema> & { actor: string }) => {
    const { userId, permissions, actor } = input;
    
    const adminOrgData = await getAdminAndOrg(actor);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    
    if (adminOrgData.userRole !== 'admin') {
      throw new Error("Apenas administradores podem alterar permissões.");
    }
  
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
  
    if (!userDoc.exists || userDoc.data()?.organizationId !== adminOrgData.organizationId) {
      throw new Error("Usuário não encontrado nesta organização.");
    }

    // Ensure Pulse is disabled if not on performance plan
    if (adminOrgData.planId !== 'performance' && permissions.qoroPulse) {
        permissions.qoroPulse = false;
    }
  
    await userDocRef.update({ permissions });
  
    return { success: true };
};

type PlanId = 'free' | 'growth' | 'performance';

const planLevels: Record<PlanId, number> = { 
    free: 0, 
    growth: 1, 
    performance: 2 
};

const isValidPlanId = (id: any): id is PlanId => {
    return id in planLevels;
};


export const handleSubscriptionChange = async (subscriptionId: string, newPriceId: string, newStatus: string) => {
    const orgQuery = await adminDb.collection('organizations').where('stripeSubscriptionId', '==', subscriptionId).limit(1).get();
    
    if (orgQuery.empty) {
        console.warn(`Webhook received for unknown subscription ID: ${subscriptionId}. No organization found.`);
        return;
    }
    
    const orgDoc = orgQuery.docs[0];
    const organizationId = orgDoc.id;
    const oldPlanId = orgDoc.data().planId as PlanId;

    // Determine new planId from priceId
    let newPlanId: PlanId = 'free';
    if (newStatus !== 'canceled' && newStatus !== 'unpaid') {
        if (newPriceId === process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID) {
            newPlanId = 'performance';
        } else if (newPriceId === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID) {
            newPlanId = 'growth';
        }
    }


    let notificationMessage: string | null = null;
    if (isValidPlanId(newPlanId) && isValidPlanId(oldPlanId) && newPlanId !== oldPlanId) {
        if (planLevels[newPlanId] < planLevels[oldPlanId]) {
            notificationMessage = getLostFeaturesMessage(oldPlanId, newPlanId);
        } else {
            notificationMessage = getGainedFeaturesMessage(oldPlanId, newPlanId);
        }
    }


    // Update organization document
    await orgDoc.ref.update({
        stripeSubscriptionStatus: newStatus,
        stripePriceId: newPriceId,
        planId: newPlanId,
        lastSystemNotification: notificationMessage,
    });

    // Update all users in the organization
    const usersSnapshot = await adminDb.collection('users').where('organizationId', '==', organizationId).get();
    if (usersSnapshot.empty) {
        return;
    }

    const hasPulseAccess = newPlanId === 'performance';
    const batch = adminDb.batch();

    const userUpdatePromises = usersSnapshot.docs.map(async (userDoc) => {
        const userRef = userDoc.ref;
        const currentPermissions = userDoc.data().permissions || {};
        
        // Update user document in Firestore
        batch.update(userRef, {
            planId: newPlanId,
            permissions: {
                ...currentPermissions,
                qoroPulse: hasPulseAccess,
            },
            stripeSubscriptionStatus: newStatus,
        });

        // Update custom claims for real-time access changes
        return adminAuth.setCustomUserClaims(userDoc.id, {
            organizationId,
            role: userDoc.data().role,
            planId: newPlanId,
        });
    });

    // Commit batch and wait for all claims to be updated
    await Promise.all([batch.commit(), ...userUpdatePromises]);

    console.log(`✅ Subscription for organization ${organizationId} updated to plan '${newPlanId}'. ${usersSnapshot.size} users affected.`);
};
