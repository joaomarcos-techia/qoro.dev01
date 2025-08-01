
'use server';
/**
 * @fileOverview Finance management flows.
 * - listAccounts - Lists all financial accounts for the user's organization.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AccountProfileSchema } from '@/ai/schemas';
import * as financeService from '@/services/financeService';

const ActorSchema = z.object({ actor: z.string() });

// Define flows
const listAccountsFlow = ai.defineFlow(
    { 
        name: 'listAccountsFlow', 
        inputSchema: ActorSchema, 
        outputSchema: z.array(AccountProfileSchema) 
    },
    async ({ actor }) => financeService.listAccounts(actor)
);


// Exported functions (client-callable wrappers)
export async function listAccounts(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof AccountProfileSchema>[]> {
    return listAccountsFlow(input);
}
