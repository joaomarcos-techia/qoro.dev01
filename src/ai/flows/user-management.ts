
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


// Exported functions (client-callable wrappers)
export async function signUp(input: z.infer<typeof SignUpSchema>): Promise<{ uid: string }> {
    return ai.run('signUpFlow', async () => orgService.signUp(input));
}

export async function inviteUser(input: z.infer<typeof InviteUserSchema>): Promise<{ uid: string; email: string; organizationId: string; }> {
    return ai.run('inviteUserFlow', async () => orgService.inviteUser(input));
}

export async function listUsers(): Promise<UserProfile[]> {
    return ai.run('listUsersFlow', async () => orgService.listUsers());
}

export async function updateUserPermissions(input: z.infer<typeof UpdateUserPermissionsSchema>): Promise<{ success: boolean }> {
    return ai.run('updateUserPermissionsFlow', async () => orgService.updateUserPermissions(input));
}

export async function getOrganizationDetails(): Promise<z.infer<typeof OrganizationProfileSchema>> {
    return ai.run('getOrganizationDetailsFlow', async () => orgService.getOrganizationDetails());
}

export async function updateOrganizationDetails(input: z.infer<typeof UpdateOrganizationDetailsSchema>): Promise<{ success: boolean }> {
    return ai.run('updateOrganizationDetailsFlow', async () => orgService.updateOrganizationDetails(input));
}
