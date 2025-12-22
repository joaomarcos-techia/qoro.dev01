
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
import * as orgService from '@/services/organizationService';
import { getAdminAndOrg } from '@/services/utils';


const ActorSchema = z.object({ actor: z.string() });
const DeleteUserSchema = z.object({ userId: z.string(), actor: z.string() });

const UserProfileOutputSchema = z.object({
    name: z.string(),
    organizationName: z.string(),
    planId: z.string(),
});

const ValidateInviteInputSchema = z.object({ inviteId: z.string() });
const ValidateInviteOutputSchema = z.object({ email: z.string(), organizationName: z.string() });
const AcceptInviteInputSchema = z.object({ inviteId: z.string(), name: z.string(), uid: z.string() });
const AcceptInviteOutputSchema = z.object({ success: z.boolean() });


// --- Genkit Flows ---

const listUsersFlow = ai.defineFlow(
    { name: 'listUsersFlow', inputSchema: ActorSchema, outputSchema: z.array(UserProfileSchema) },
    async ({ actor }) => orgService.listUsers(actor)
);

const getOrganizationDetailsFlow = ai.defineFlow(
    { name: 'getOrganizationDetailsFlow', inputSchema: ActorSchema, outputSchema: OrganizationProfileSchema.nullable() },
    async ({ actor }) => {
        const adminOrgData = await getAdminAndOrg(actor);
        if (!adminOrgData) return null;
        return orgService.getOrganizationDetails(actor);
    }
);

const updateOrganizationDetailsFlow = ai.defineFlow(
    { name: 'updateOrganizationDetailsFlow', inputSchema: UpdateOrganizationDetailsSchema.extend(ActorSchema.shape), outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.updateOrganizationDetails(input, input.actor)
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
    async (input) => orgService.inviteUser(input)
);

const deleteUserFlow = ai.defineFlow(
    { name: 'deleteUserFlow', inputSchema: DeleteUserSchema, outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.deleteUser(input.userId, input.actor)
);

const validateInviteFlow = ai.defineFlow(
    { name: 'validateInviteFlow', inputSchema: ValidateInviteInputSchema, outputSchema: ValidateInviteOutputSchema },
    async (input) => orgService.validateInvite(input.inviteId)
);

const acceptInviteFlow = ai.defineFlow(
    { name: 'acceptInviteFlow', inputSchema: AcceptInviteInputSchema, outputSchema: AcceptInviteOutputSchema },
    async (input) => orgService.acceptInvite(input.inviteId, { name: input.name, uid: input.uid })
);

const updateUserPermissionsFlow = ai.defineFlow(
    { name: 'updateUserPermissionsFlow', inputSchema: UpdateUserPermissionsSchema.extend(ActorSchema.shape), outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.updateUserPermissions(input)
);

// --- Exported Functions ---

export async function inviteUser(input: z.infer<typeof InviteUserSchema> & z.infer<typeof ActorSchema>): Promise<{ inviteId: string }> {
    return inviteUserFlow(input);
}

export async function deleteUser(input: z.infer<typeof DeleteUserSchema>): Promise<{ success: boolean }> {
    return deleteUserFlow(input);
}

export async function listUsers(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserProfileSchema>[]> {
    return listUsersFlow(input);
}

export async function getOrganizationDetails(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof OrganizationProfileSchema> | null> {
    return getOrganizationDetailsFlow(input);
}

export async function updateOrganizationDetails(input: z.infer<typeof UpdateOrganizationDetailsSchema> & z.infer<typeof ActorSchema>): Promise<{ success: boolean }> {
    return updateOrganizationDetailsFlow(input);
}

export async function getUserAccessInfo(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserAccessInfoSchema> | null> {
    return getUserAccessInfoFlow(input);
}

export async function getUserProfile(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserProfileOutputSchema> | null> {
    return getUserProfileFlow(input);
}

export async function updateUserPermissions(input: z.infer<typeof UpdateUserPermissionsSchema> & z.infer<typeof ActorSchema>): Promise<{ success: boolean }> {
    return updateUserPermissionsFlow(input);
}

export async function validateInvite(input: z.infer<typeof ValidateInviteInputSchema>): Promise<z.infer<typeof ValidateInviteOutputSchema>> {
    return validateInviteFlow(input);
}

export async function acceptInvite(input: z.infer<typeof AcceptInviteInputSchema>): Promise<z.infer<typeof AcceptInviteOutputSchema>> {
    return acceptInviteFlow(input);
}
