
'use server';
/**
 * @fileOverview User and organization management flows.
 * - createUserProfile - Creates user and organization documents in Firestore.
 * - listUsers - Lists all users within the caller's organization.
 * - getOrganizationDetails - Fetches details for the user's organization.
 * - updateOrganizationDetails - Updates details for the user's organization.
 * - getUserAccessInfo - Fetches user's plan and permissions.
 * - getUserProfile - Fetches a user's name and organization name.
 * - inviteUser - Sends an invitation email to a new user.
 * - deleteUser - Deletes a user from the organization.
 * - updateUserPermissions - Updates a user's module permissions.
 * - validateInvite - Checks if an invite ID is valid.
 * - acceptInvite - Associates a new user with an organization via an invite.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    InviteUserSchema, 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    OrganizationProfileSchema, 
    UserProfileSchema,
    UserAccessInfoSchema,
    UserProfileCreationSchema,
} from '@/ai/schemas';
import { getAdminAndOrg } from '@/services/utils';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { stripe } from '@/lib/stripe';


const ActorSchema = z.object({ actor: z.string() });
const DeleteUserSchema = z.object({ userId: z.string(), actor: z.string() });

const UserProfileOutputSchema = z.object({
    name: z.string(),
    organizationName: z.string(),
    planId: z.string(),
});

// --- Service logic moved directly into the flow file ---

export const createUserProfile = async (input: z.infer<typeof UserProfileCreationSchema>) => {
    const {
      uid, name, email, organizationName, cnpj,
      contactEmail, contactPhone, planId, stripePriceId,
      stripeCustomerId, stripeSubscriptionId, stripeSubscriptionStatus
    } = input;
  
    const orgRef = adminDb.collection('organizations').doc();
    const userRef = adminDb.collection('users').doc(uid);
  
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
        stripeCurrentPeriodEnd: null, // Will be updated by webhook
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
  
    await adminAuth.deleteUser(userId);
    await userRef.delete();
  
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

export const handleSubscriptionChange = async (subscriptionId: string, newPriceId: string, status: string) => {
    const orgSnapshot = await adminDb.collection('organizations').where('stripeSubscriptionId', '==', subscriptionId).limit(1).get();
    if (orgSnapshot.empty) {
      return;
    }
  
    const orgDoc = orgSnapshot.docs[0];
    const newPlanId = newPriceId === process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID ? 'performance' : (newPriceId === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID ? 'growth' : 'free');
    
    let lastSystemNotification = null;
    if (status === 'active' && orgDoc.data().planId !== newPlanId) {
        lastSystemNotification = `Seu plano foi alterado para ${'${newPlanId}'}.`;
    } else if (status === 'canceled' || status === 'unpaid') {
        lastSystemNotification = "Houve um problema com sua assinatura. Seu plano foi alterado para o gratuito.";
    }

    await orgDoc.ref.update({
      stripePriceId: newPriceId,
      stripeSubscriptionStatus: status,
      planId: newPlanId,
      lastSystemNotification,
    });
  
    const usersSnapshot = await adminDb.collection('users').where('organizationId', '==', orgDoc.id).get();
    const batch = adminDb.batch();
    usersSnapshot.forEach(userDoc => {
      const userRef = adminDb.collection('users').doc(userDoc.id);
      batch.update(userRef, { planId: newPlanId });
      adminAuth.setCustomUserClaims(userDoc.id, { ...userDoc.data().claims, planId: newPlanId });
    });
  
    await batch.commit();
};

export async function validateInvite(input: { inviteId: string }): Promise<{ email: string; organizationName: string; }> {
    const { inviteId } = input;
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

export async function acceptInvite(input: { inviteId: string; name: string; uid: string; }): Promise<{ success: boolean; }> {
    const { inviteId, name, uid } = input;
    if (!uid) {
        throw new Error('UID do usuário é inválido.');
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
            createdAt: new Date(),
            planId: planId,
            permissions: {
                qoroCrm: true,
                qoroPulse: planId === 'performance',
                qoroTask: true,
                qoroFinance: true,
            },
        });

        transaction.update(inviteRef, { status: 'accepted', acceptedBy: uid, acceptedAt: new Date() });
        await adminAuth.setCustomUserClaims(uid, { organizationId: inviteData.organizationId, role: 'member', planId });
        return { success: true };
    });
};

// --- Genkit Flows ---

const createUserProfileFlow = ai.defineFlow(
    {
        name: 'createUserProfileFlow',
        inputSchema: UserProfileCreationSchema,
        outputSchema: z.object({ uid: z.string() })
    },
    async (input) => createUserProfile(input)
);

const listUsersFlow = ai.defineFlow(
    { name: 'listUsersFlow', inputSchema: ActorSchema, outputSchema: z.array(UserProfileSchema) },
    async ({ actor }) => listUsers(actor)
);

const getOrganizationDetailsFlow = ai.defineFlow(
    { name: 'getOrganizationDetailsFlow', inputSchema: ActorSchema, outputSchema: OrganizationProfileSchema.nullable() },
    async ({ actor }) => {
        const adminOrgData = await getAdminAndOrg(actor);
        if (!adminOrgData) return null;
        return getOrganizationDetails(actor);
    }
);

const updateOrganizationDetailsFlow = ai.defineFlow(
    { name: 'updateOrganizationDetailsFlow', inputSchema: UpdateOrganizationDetailsSchema.extend(ActorSchema.shape), outputSchema: z.object({ success: z.boolean() }) },
    async (input) => updateOrganizationDetails(input, input.actor)
);

const getUserAccessInfoFlow = ai.defineFlow(
    { name: 'getUserAccessInfoFlow', inputSchema: ActorSchema, outputSchema: UserAccessInfoSchema.nullable() },
    async ({ actor }) => {
        const adminOrgData = await getAdminAndOrg(actor);
        if (!adminOrgData) {
            return null; // Return null if user/org data is not ready
        }
        
        const { planId, userData, userRole } = adminOrgData;

        let permissions = userData.permissions || {
            qoroCrm: true,
            qoroPulse: false,
            qoroTask: true,
            qoroFinance: true,
        };

        if (planId === 'performance') {
            permissions.qoroPulse = true;
        } else if (planId === 'growth') {
            permissions.qoroPulse = false;
        }
        
        return {
            planId,
            permissions,
            role: userRole as 'admin' | 'member',
        }
    }
);

const getUserProfileFlow = ai.defineFlow(
    { name: 'getUserProfileFlow', inputSchema: ActorSchema, outputSchema: UserProfileOutputSchema.nullable() },
    async ({ actor }) => {
        const adminOrgData = await getAdminAndOrg(actor);
        if (!adminOrgData) {
            return null; // Return null if user/org data is not ready
        }
        const { userData, organizationName, planId } = adminOrgData;
        return {
            name: userData.name || userData.email || 'Usuário',
            organizationName: organizationName || 'Organização',
            planId: planId || 'free',
        }
    }
);

const inviteUserFlow = ai.defineFlow(
    { name: 'inviteUserFlow', inputSchema: InviteUserSchema.extend(ActorSchema.shape), outputSchema: z.object({ inviteId: z.string() }) },
    async (input) => inviteUser(input)
);

const deleteUserFlow = ai.defineFlow(
    { name: 'deleteUserFlow', inputSchema: DeleteUserSchema, outputSchema: z.object({ success: z.boolean() }) },
    async (input) => deleteUser(input.userId, input.actor)
);

const validateInviteFlow = ai.defineFlow(
    { name: 'validateInviteFlow', inputSchema: z.object({ inviteId: z.string() }), outputSchema: z.object({ email: z.string(), organizationName: z.string() }) },
    async (input) => validateInvite(input)
);

const acceptInviteFlow = ai.defineFlow(
    { name: 'acceptInviteFlow', inputSchema: z.object({ inviteId: z.string(), name: z.string(), uid: z.string() }), outputSchema: z.object({ success: z.boolean() }) },
    async (input) => acceptInvite(input)
);


// Exported flow wrappers
export async function createUserProfileFlowWrapper(input: z.infer<typeof UserProfileCreationSchema>): Promise<{ uid: string }> {
    return createUserProfileFlow(input);
}

export async function inviteUserFlowWrapper(input: z.infer<typeof InviteUserSchema> & z.infer<typeof ActorSchema>): Promise<{ inviteId: string }> {
    return inviteUserFlow(input);
}

export async function deleteUserFlowWrapper(input: z.infer<typeof DeleteUserSchema>): Promise<{ success: boolean }> {
    return deleteUserFlow(input);
}

export async function listUsersFlowWrapper(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserProfileSchema>[]> {
    return listUsersFlow(input);
}

export async function getOrganizationDetailsFlowWrapper(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof OrganizationProfileSchema> | null> {
    return getOrganizationDetailsFlow(input);
}

export async function updateOrganizationDetailsFlowWrapper(input: z.infer<typeof UpdateOrganizationDetailsSchema> & z.infer<typeof ActorSchema>): Promise<{ success: boolean }> {
    return updateOrganizationDetailsFlow(input);
}

export async function getUserAccessInfoFlowWrapper(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserAccessInfoSchema> | null> {
    return getUserAccessInfoFlow(input);
}

export async function getUserProfileFlowWrapper(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserProfileOutputSchema> | null> {
    return getUserProfileFlow(input);
}

export async function updateUserPermissionsFlowWrapper(input: z.infer<typeof UpdateUserPermissionsSchema> & z.infer<typeof ActorSchema>): Promise<{ success: boolean }> {
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
}
