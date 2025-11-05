
'use server';
/**
 * @fileOverview Finance management flows.
 * - createAccount - Creates a new financial account.
 * - listAccounts - Lists all financial accounts for the user's organization.
 * - updateAccount - Updates an existing financial account.
 * - deleteAccount - Deletes a financial account.
 * - createTransaction - Creates a new financial transaction.
 * - listTransactions - Lists all financial transactions for the user's organization.
 * - updateTransaction - Updates an existing financial transaction.
 * - deleteTransaction - Deletes a financial transaction.
 * - getFinanceDashboardMetrics - Retrieves key metrics for the Finance dashboard.
 * - createBill - Creates a new bill (payable/receivable).
 * - listBills - Lists all bills.
 * - updateBill - Updates a bill.
 * - deleteBill - Deletes a bill.
 * - bulkCreateTransactions - Creates multiple transactions at once.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    AccountSchema, 
    AccountProfileSchema, 
    TransactionSchema, 
    TransactionProfileSchema, 
    UpdateAccountSchema, 
    UpdateTransactionSchema,
    BillSchema,
    BillProfileSchema,
    UpdateBillSchema
} from '@/ai/schemas';
import * as financeService from '@/services/financeService';
import * as transactionService from '@/services/transactionService';
import * as billService from '@/services/billService';

const ActorSchema = z.object({ actor: z.string() });

const ListTransactionsInputSchema = ActorSchema.extend({
    dateRange: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
    }).optional(),
    accountId: z.string().optional(),
});

const GetDashboardMetricsInputSchema = ActorSchema.extend({
    dateRange: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
    }).optional()
});

const DeleteAccountInputSchema = z.object({
    accountId: z.string(),
}).extend(ActorSchema.shape);

const DeleteTransactionInputSchema = z.object({
    transactionId: z.string(),
}).extend(ActorSchema.shape);

const DeleteBillInputSchema = z.object({
    billId: z.string(),
}).extend(ActorSchema.shape);

const DashboardMetricsOutputSchema = z.object({
    totalBalance: z.number(),
    totalIncome: z.number(),
    totalExpense: z.number(),
    netProfit: z.number(),
});

const BulkCreateTransactionsInputSchema = z.object({
    transactions: z.array(TransactionSchema),
    accountId: z.string(),
    actor: z.string(),
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

const updateAccountFlow = ai.defineFlow(
    {
        name: 'updateAccountFlow',
        inputSchema: UpdateAccountSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => financeService.updateAccount(input.id, input, input.actor)
);

const deleteAccountFlow = ai.defineFlow(
    {
        name: 'deleteAccountFlow',
        inputSchema: DeleteAccountInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => financeService.deleteAccount(input.accountId, input.actor)
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
        inputSchema: ListTransactionsInputSchema,
        outputSchema: z.array(TransactionProfileSchema) 
    },
    async ({ actor, dateRange, accountId }) => transactionService.listTransactions(actor, dateRange, accountId)
);

const updateTransactionFlow = ai.defineFlow(
    {
        name: 'updateTransactionFlow',
        inputSchema: UpdateTransactionSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => transactionService.updateTransaction(input, input.actor)
);

const deleteTransactionFlow = ai.defineFlow(
    {
        name: 'deleteTransactionFlow',
        inputSchema: DeleteTransactionInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => transactionService.deleteTransaction(input.transactionId, input.actor)
);

// Define Bill flows
const createBillFlow = ai.defineFlow(
    {
        name: 'createBillFlow',
        inputSchema: BillSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => billService.createBill(input, input.actor)
);

const listBillsFlow = ai.defineFlow(
    {
        name: 'listBillsFlow',
        inputSchema: ActorSchema,
        outputSchema: z.array(BillProfileSchema)
    },
    async ({ actor }) => billService.listBills(actor)
);

const updateBillFlow = ai.defineFlow(
    {
        name: 'updateBillFlow',
        inputSchema: UpdateBillSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => billService.updateBill(input, input.actor)
);

const deleteBillFlow = ai.defineFlow(
    {
        name: 'deleteBillFlow',
        inputSchema: DeleteBillInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => billService.deleteBill(input.billId, input.actor)
);

const getFinanceDashboardMetricsFlow = ai.defineFlow(
    {
        name: 'getFinanceDashboardMetricsFlow',
        inputSchema: GetDashboardMetricsInputSchema,
        outputSchema: DashboardMetricsOutputSchema
    },
    async ({ actor, dateRange }) => financeService.getFinanceDashboardMetrics(actor, dateRange)
);

const bulkCreateTransactionsFlow = ai.defineFlow(
    {
        name: 'bulkCreateTransactionsFlow',
        inputSchema: BulkCreateTransactionsInputSchema,
        outputSchema: z.object({ count: z.number() }),
    },
    async ({ transactions, accountId, actor }) => {
        return transactionService.bulkCreateTransactions(transactions, accountId, actor);
    }
);


// Exported functions (client-callable wrappers)
export async function createAccount(input: z.infer<typeof AccountSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createAccountFlow(input);
}

export async function listAccounts(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof AccountProfileSchema>[]> {
    return listAccountsFlow(input);
}

export async function updateAccount(input: z.infer<typeof UpdateAccountSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return updateAccountFlow(input);
}

export async function deleteAccount(input: z.infer<typeof DeleteAccountInputSchema>): Promise<{ id: string; success: boolean }> {
    return deleteAccountFlow(input);
}

export async function createTransaction(input: z.infer<typeof TransactionSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createTransactionFlow(input);
}

export async function listTransactions(input: z.infer<typeof ListTransactionsInputSchema>): Promise<z.infer<typeof TransactionProfileSchema>[]> {
    return listTransactionsFlow(input);
}

export async function updateTransaction(input: z.infer<typeof UpdateTransactionSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return updateTransactionFlow(input);
}

export async function deleteTransaction(input: z.infer<typeof DeleteTransactionInputSchema>): Promise<{ id: string; success: boolean }> {
    return deleteTransactionFlow(input);
}

export async function getFinanceDashboardMetrics(input: z.infer<typeof GetDashboardMetricsInputSchema>): Promise<z.infer<typeof DashboardMetricsOutputSchema>> {
    return getFinanceDashboardMetricsFlow(input);
}

export async function createBill(input: z.infer<typeof BillSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createBillFlow(input);
}

export async function listBills(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof BillProfileSchema>[]> {
    return listBillsFlow(input);
}

export async function updateBill(input: z.infer<typeof UpdateBillSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return updateBillFlow(input);
}

export async function deleteBill(input: z.infer<typeof DeleteBillInputSchema>): Promise<{ id: string; success: boolean }> {
    return deleteBillFlow(input);
}

export async function bulkCreateTransactions(input: z.infer<typeof BulkCreateTransactionsInputSchema>): Promise<{ count: number; }> {
    return bulkCreateTransactionsFlow(input);
}
