
'use server';
/**
 * @fileOverview Finance management flows.
 * - createAccount - Creates a new financial account.
 * - listAccounts - Lists all financial accounts for the user's organization.
 * - createTransaction - Creates a new financial transaction.
 * - listTransactions - Lists all financial transactions for the user's organization.
 * - getDashboardMetrics - Retrieves key metrics for the Finance dashboard.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AccountSchema, AccountProfileSchema, TransactionSchema, TransactionProfileSchema } from '@/ai/schemas';
import * as financeService from '@/services/financeService';
import * as transactionService from '@/services/transactionService';

const ActorSchema = z.object({ actor: z.string() });

const DashboardMetricsOutputSchema = z.object({
    totalBalance: z.number(),
    totalIncome: z.number(),
    totalExpense: z.number(),
    netProfit: z.number(),
});

// Define Account flows
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

// Define Transaction flows
const createTransactionFlow = ai.defineFlow(
    { 
        name: 'createTransactionFlow', 
        inputSchema: TransactionSchema.extend(ActorSchema.shape), 
        outputSchema: z.object({ id: z.string() }) 
    },
    async (input) => transactionService.createTransaction(input, input.actor)
);

const listTransactionsFlow = ai.defineFlow(
    { 
        name: 'listTransactionsFlow', 
        inputSchema: ActorSchema, 
        outputSchema: z.array(TransactionProfileSchema) 
    },
    async ({ actor }) => transactionService.listTransactions(actor)
);

const getDashboardMetricsFlow = ai.defineFlow(
    {
        name: 'getFinanceDashboardMetricsFlow',
        inputSchema: ActorSchema,
        outputSchema: DashboardMetricsOutputSchema
    },
    async ({ actor }) => financeService.getDashboardMetrics(actor)
);

// Exported functions (client-callable wrappers)
export async function createAccount(input: z.infer<typeof AccountSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createAccountFlow(input);
}

export async function listAccounts(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof AccountProfileSchema>[]> {
    return listAccountsFlow(input);
}

export async function createTransaction(input: z.infer<typeof TransactionSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createTransactionFlow(input);
}

export async function listTransactions(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof TransactionProfileSchema>[]> {
    return listTransactionsFlow(input);
}

export async function getDashboardMetrics(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof DashboardMetricsOutputSchema>> {
    return getDashboardMetricsFlow(input);
}
