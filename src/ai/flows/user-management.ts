
'use server';
/**
 * @fileOverview User and organization management flows.
 * - signUp - Creates a new user and organization.
 * - inviteUser - Invites a user to an organization via email.
 * - listUsers - Lists all users within the caller's organization.
 * - updateUserPermissions - Updates the application permissions for a specific user.
 * - getOrganizationDetails - Fetches details for the user's organization.
 * - updateOrganizationDetails - Updates details for the user's organization.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    SignUpSchema, 
    InviteUserSchema, 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    OrganizationProfileSchema, 
    UserProfileSchema
} from '@/ai/schemas';
import * as orgService from '@/services/organizationService';
import type { UserProfile } from '@/ai/schemas';
import { UserRecord } from 'firebase-admin/auth';

// Define flows
const signUpFlow = ai.defineFlow(
    { name: 'signUpFlow', inputSchema: SignUpSchema, outputSchema: z.any() },
    async (input) => orgService.signUp(input)
);

const inviteUserFlow = ai.defineFlow(
    { name: 'inviteUserFlow', inputSchema: InviteUserSchema, outputSchema: z.object({ uid: z.string(), email: z.string(), organizationId: z.string() }) },
    async (input) => orgService.inviteUser(input)
);

const listUsersFlow = ai.defineFlow(
    { name: 'listUsersFlow', inputSchema: z.undefined(), outputSchema: z.array(UserProfileSchema) },
    async () => orgService.listUsers()
);

const updateUserPermissionsFlow = ai.defineFlow(
    { name: 'updateUserPermissionsFlow', inputSchema: UpdateUserPermissionsSchema, outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.updateUserPermissions(input)
);

const getOrganizationDetailsFlow = ai.defineFlow(
    { name: 'getOrganizationDetailsFlow', inputSchema: z.undefined(), outputSchema: OrganizationProfileSchema },
    async () => orgService.getOrganizationDetails()
);

const updateOrganizationDetailsFlow = ai.defineFlow(
    { name: 'updateOrganizationDetailsFlow', inputSchema: UpdateOrganizationDetailsSchema, outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.updateOrganizationDetails(input)
);


// Exported functions (client-callable wrappers)
export async function signUp(input: z.infer<typeof SignUpSchema>): Promise<UserRecord> {
    return signUpFlow(input);
}

export async function inviteUser(input: z.infer<typeof InviteUserSchema>): Promise<{ uid: string; email: string; organizationId: string; }> {
    return inviteUserFlow(input);
}

export async function listUsers(): Promise<UserProfile[]> {
    return listUsersFlow();
}

export async function updateUserPermissions(input: z.infer<typeof UpdateUserPermissionsSchema>): Promise<{ success: boolean }> {
    return updateUserPermissionsFlow(input);
}

export async function getOrganizationDetails(): Promise<z.infer<typeof OrganizationProfileSchema>> {
    return getOrganizationDetailsFlow();
}

export async function updateOrganizationDetails(input: z.infer<typeof UpdateOrganizationDetailsSchema>): Promise<{ success: boolean }> {
    return updateOrganizationDetailsFlow(input);
}
