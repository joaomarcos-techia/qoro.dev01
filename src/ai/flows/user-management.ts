

'use server';
/**
 * @fileOverview User and organization management flows.
 * - signUp - Creates a new user and organization.
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
    UserAccessInfoSchema
} from '@/ai/schemas';
import * as orgService from '@/services/organizationService';
import { getAdminAndOrg } from '@/services/utils';
import type { UserProfile } from '@/ai/schemas';
import { UserRecord } from 'firebase-admin/auth';

const ActorSchema = z.object({ actor: z.string() });

const UserProfileOutputSchema = z.object({
    name: z.string(),
    organizationName: z.string(),
});

// Define flows
const signUpFlow = ai.defineFlow(
    { name: 'signUpFlow', inputSchema: SignUpSchema.extend({ uid: z.string() }), outputSchema: z.object({ uid: z.string() }) },
    async (input) => orgService.signUp(input)
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
    { name: 'getOrganizationDetailsFlow', inputSchema: ActorSchema, outputSchema: OrganizationProfileSchema },
    async ({ actor }) => orgService.getOrganizationDetails(actor)
);

const updateOrganizationDetailsFlow = ai.defineFlow(
    { name: 'updateOrganizationDetailsFlow', inputSchema: UpdateOrganizationDetailsSchema.extend(ActorSchema.shape), outputSchema: z.object({ success: z.boolean() }) },
    async (input) => orgService.updateOrganizationDetails(input, input.actor)
);

const getUserAccessInfoFlow = ai.defineFlow(
    { name: 'getUserAccessInfoFlow', inputSchema: ActorSchema, outputSchema: UserAccessInfoSchema },
    async ({ actor }) => {
        const { planId, userData } = await getAdminAndOrg(actor);

        // Permissões padrão para o plano gratuito
        let permissions = {
            qoroPulse: false, // Bloqueado no plano gratuito
            qoroTask: true,   // Módulo base de tarefas é permitido
            qoroCrm: true,    // Módulo base de CRM é permitido
            qoroFinance: true, // Módulo base de Finanças é permitido
        };

        // Planos pagos (Growth e Performance) têm acesso a tudo
        if (planId === 'growth' || planId === 'performance') {
            permissions = {
                qoroCrm: true,
                qoroPulse: true,
                qoroTask: true,
                qoroFinance: true,
            };
        }
        
        return {
            planId,
            permissions
        }
    }
);

const getUserProfileFlow = ai.defineFlow(
    { name: 'getUserProfileFlow', inputSchema: ActorSchema, outputSchema: UserProfileOutputSchema },
    async ({ actor }) => {
        const { userData, organizationName } = await getAdminAndOrg(actor);
        return {
            name: userData.name || userData.email || 'Usuário',
            organizationName: organizationName || 'Organização',
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

export async function getOrganizationDetails(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof OrganizationProfileSchema>> {
    return getOrganizationDetailsFlow(input);
}

export async function updateOrganizationDetails(input: z.infer<typeof UpdateOrganizationDetailsSchema> & z.infer<typeof ActorSchema>): Promise<{ success: boolean }> {
    return updateOrganizationDetailsFlow(input);
}

export async function getUserAccessInfo(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserAccessInfoSchema>> {
    return getUserAccessInfoFlow(input);
}

export async function getUserProfile(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof UserProfileOutputSchema>> {
    return getUserProfileFlow(input);
}
