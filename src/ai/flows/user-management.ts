

'use server';
/**
 * @fileOverview User and organization management flows.
 * - signUp - Creates a new user and organization for the free plan.
 * - inviteUser - Invites a user to an organization via email.
 * - listUsers - Lists all users within the caller's organization.
 * - updateUserPermissions - Updates the application permissions for a specific user.
 * - getOrganizationDetails - Fetches details for the user's organization.
 * - updateOrganizationDetails - Updates details for the user's organization.
 * - getUserAccessInfo - Fetches user's plan and permissions.
 * - getUserProfile - Fetches a user's name and organization name.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    SignUpSchema, 
    InviteUserSchema, 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    OrganizationProfileSchema, 
    UserProfileSchema,
    UserAccessInfoSchema,
    UserProfileCreationSchema
} from '@/ai/schemas';
import * as orgService from '@/services/organizationService';
import { getAdminAndOrg } from '@/services/utils';
import type { UserProfile } from '@/ai/schemas';
import { UserRecord } from 'firebase-admin/auth';

const ActorSchema = z.object({ actor: z.string() });

const UserProfileOutputSchema = z.object({
    name: z.string(),
    organizationName: z.string(),
    planId: z.string(),
});

// Define flows
const signUpFlow = ai.defineFlow(
    { 
        name: 'signUpFlow', 
        inputSchema: SignUpSchema.extend({ uid: z.string() }), 
        outputSchema: z.object({ uid: z.string() }) 
    },
    async (input) => {
        if (input.planId !== 'free') {
            throw new Error("This endpoint is for the free plan only. Paid plans are activated via payment webhook.");
        }
        
        const creationData: z.infer<typeof UserProfileCreationSchema> = {
            ...input,
            planId: 'free',
            stripePriceId: 'free', // Explicitly set for free plan
        };

        return orgService.createUserProfile(creationData);
    }
);

const inviteUserFlow = ai.defineFlow(
    { name: 'inviteUserFlow', inputSchema: InviteUserSchema.extend(ActorSchema.shape), outputSchema: z.object({ uid: z.string(), email: z.string(), organizationId: z.string() }) },
    async (input) => orgService.inviteUser(input.email, input.actor)
);

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
        
        const { planId, userData } = adminOrgData;

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
            permissions
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


// Exported functions (client-callable wrappers)
export async function signUp(input: z.infer<typeof SignUpSchema> & { uid: string }): Promise<{uid: string}> {
    return signUpFlow(input);
}

export async function inviteUser(input: z.infer<typeof InviteUserSchema> & z.infer<typeof ActorSchema>): Promise<{ uid: string; email: string; organizationId: string; }> {
    return inviteUserFlow(input);
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
