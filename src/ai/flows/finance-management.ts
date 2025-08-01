
'use server';
/**
 * @fileOverview Finance management flows.
 * - createAccount - Creates a new financial account.
 * - listAccounts - Lists all financial accounts for the user's organization.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AccountSchema, AccountProfileSchema } from '@/ai/schemas';
import * as financeService from '@/services/financeService';

const ActorSchema = z.object({ actor: z.string() });

// Define flows
const createAccountFlow = ai.defineFlow(
    { 
        name: 'createAccountFlow', 
        inputSchema: AccountSchema.extend(ActorSchema.shape), 
        outputSchema: z.object({ id: z.string() }) 
    },
    async (input) => financeService.createAccount(input, input.actor)
);

const listAccountsFlow = ai.defineFlow(
    { 
        name: 'listAccountsFlow', 
        inputSchema: ActorSchema, 
        outputSchema: z.array(AccountProfileSchema) 
    },
    async ({ actor }) => financeService.listAccounts(actor)
);


// Exported functions (client-callable wrappers)
export async function createAccount(input: z.infer<typeof AccountSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createAccountFlow(input);
}

export async function listAccounts(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof AccountProfileSchema>[]> {
    return listAccountsFlow(input);
}
