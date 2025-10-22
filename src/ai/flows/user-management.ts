

'use server';
/**
 * @fileOverview User and organization management flows.
 * - signUp (deprecated, handled by webhook)
 * - listUsers - Lists all users within the caller's organization.
 * - updateUserPermissions - Updates the application permissions for a specific user.
 * - getOrganizationDetails - Fetches details for the user's organization.
 * - updateOrganizationDetails - Updates details for the user's organization.
 * - getUserAccessInfo - Fetches user's plan and permissions.
 * - getUserProfile - Fetches a user's name and organization name.
 * - inviteUser - Sends an invitation email to a new user.
 * - deleteUser - Deletes a user from the organization.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    InviteUserSchema, 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    OrganizationProfileSchema, 
    UserProfileSchema,
    UserAccessInfoSchema
} from '@/ai/schemas';
import * as orgService from '@/services/organizationService';
import { getAdminAndOrg } from '@/services/utils';
import type { UserProfile } from '@/ai/schemas';

const ActorSchema = z.object({ actor: z.string() });
const DeleteUserSchema = z.object({ userId: z.string(), actor: z.string() });

const UserProfileOutputSchema = z.object({
    name: z.string(),
    organizationName: z.string(),
    planId: z.string(),
});

const listUsersFlow = ai.defineFlow(
    { name: 'listUsersFlow', inputSchema: ActorSchema, outputSchema: z.array(UserProfileSchema) },
    async ({ actor }) => orgService.listUsers(actor)
);

const updateUserPermissionsFlow = ai.defineFlow(
    { name: 'updateUserPermissionsFlow', inputSchema: UpdateUserPermissionsSchema.extend(ActorSchema.shape), outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.updateUserPermissions(input, input.actor)
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

        // Default permissions are for the 'free' plan
        let permissions = {
            qoroCrm: true,
            qoroPulse: false,
            qoroTask: true,
            qoroFinance: true,
        };

        // Grant access to QoroPulse only for the 'performance' plan
        if (planId === 'performance') {
            permissions.qoroPulse = true;
        } else if (planId === 'growth') {
            // Growth plan has access to everything BUT Pulse
            permissions.qoroPulse = false;
        }
        
        return {
            planId,
            permissions,
            role: userRole,
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
    { name: 'inviteUserFlow', inputSchema: InviteUserSchema, outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.inviteUser(input.email, input.actor)
);

const deleteUserFlow = ai.defineFlow(
    { name: 'deleteUserFlow', inputSchema: DeleteUserSchema, outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.deleteUser(input.userId, input.actor)
);


// Exported functions (client-callable wrappers)
export async function inviteUser(input: z.infer<typeof InviteUserSchema>): Promise<{ success: boolean }> {
    return inviteUserFlow(input);
}

export async function deleteUser(input: z.infer<typeof DeleteUserSchema>): Promise<{ success: boolean }> {
    return deleteUserFlow(input);
}

export async function listUsers(input: z.infer<typeof ActorSchema>): Promise<UserProfile[]> {
    return listUsersFlow(input);
}

export async function updateUserPermissions(input: z.infer<typeof UpdateUserPermissionsSchema> & z.infer<typeof ActorSchema>): Promise<{ success: boolean }> {
    return updateUserPermissionsFlow(input);
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
