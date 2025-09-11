'use server';
/**
 * @fileOverview Finance reconciliation flows.
 * - createReconciliation - Saves a new bank statement file.
 * - getReconciliation - Retrieves a specific reconciliation record.
 * - listReconciliations - Lists all saved reconciliations.
 * - updateReconciliation - Updates the name of a reconciliation record.
 * - deleteReconciliation - Deletes a reconciliation record.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ReconciliationSchema, ReconciliationProfileSchema } from '@/ai/schemas';
import * as reconciliationService from '@/services/reconciliationService';

const ActorSchema = z.object({ actor: z.string() });
const GetReconciliationInputSchema = z.object({ id: z.string(), actor: z.string() });
const UpdateReconciliationInputSchema = z.object({ id: z.string(), fileName: z.string(), actor: z.string() });
const DeleteReconciliationInputSchema = z.object({ id: z.string(), actor: z.string() });

// --- Define Flows ---

const createReconciliationFlow = ai.defineFlow(
    {
        name: 'createReconciliationFlow',
        inputSchema: ReconciliationSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() }),
    },
    async (input) => reconciliationService.createReconciliation(input)
);

const getReconciliationFlow = ai.defineFlow(
    {
        name: 'getReconciliationFlow',
        inputSchema: GetReconciliationInputSchema,
        outputSchema: ReconciliationProfileSchema.nullable(),
    },
    async ({ id, actor }) => reconciliationService.getReconciliation(id, actor)
);

const listReconciliationsFlow = ai.defineFlow(
    {
        name: 'listReconciliationsFlow',
        inputSchema: ActorSchema,
        outputSchema: z.array(ReconciliationProfileSchema),
    },
    async ({ actor }) => reconciliationService.listReconciliations(actor)
);

const updateReconciliationFlow = ai.defineFlow(
    {
        name: 'updateReconciliationFlow',
        inputSchema: UpdateReconciliationInputSchema,
        outputSchema: z.object({ id: z.string() }),
    },
    async ({ id, fileName, actor }) => reconciliationService.updateReconciliation(id, fileName, actor)
);

const deleteReconciliationFlow = ai.defineFlow(
    {
        name: 'deleteReconciliationFlow',
        inputSchema: DeleteReconciliationInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() }),
    },
    async ({ id, actor }) => reconciliationService.deleteReconciliation(id, actor)
);


// --- Exported Functions ---

export async function createReconciliation(input: z.infer<typeof ReconciliationSchema> & { actor: string }): Promise<{ id: string }> {
    return createReconciliationFlow(input);
}

export async function getReconciliation(input: z.infer<typeof GetReconciliationInputSchema>): Promise<z.infer<typeof ReconciliationProfileSchema> | null> {
    return getReconciliationFlow(input);
}

export async function listReconciliations(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof ReconciliationProfileSchema>[]> {
    return listReconciliationsFlow(input);
}

export async function updateReconciliation(input: z.infer<typeof UpdateReconciliationInputSchema>): Promise<{ id: string }> {
    return updateReconciliationFlow(input);
}

export async function deleteReconciliation(input: z.infer<typeof DeleteReconciliationInputSchema>): Promise<{ id: string; success: boolean; }> {
    return deleteReconciliationFlow(input);
}