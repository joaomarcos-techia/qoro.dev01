
'use server';
/**
 * @fileOverview Supplier management flows.
 * - createSupplier - Creates a new supplier.
 * - listSuppliers - Lists all suppliers for the user's organization.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SupplierSchema, SupplierProfileSchema } from '@/ai/schemas';
import * as supplierService from '@/services/supplierService';

const ActorSchema = z.object({ actor: z.string() });

// Define flows
const createSupplierFlow = ai.defineFlow(
    { 
        name: 'createSupplierFlow', 
        inputSchema: SupplierSchema.extend(ActorSchema.shape), 
        outputSchema: z.object({ id: z.string() }) 
    },
    async (input) => supplierService.createSupplier(input, input.actor)
);

const listSuppliersFlow = ai.defineFlow(
    { 
        name: 'listSuppliersFlow', 
        inputSchema: ActorSchema, 
        outputSchema: z.array(SupplierProfileSchema) 
    },
    async ({ actor }) => supplierService.listSuppliers(actor)
);

// Exported functions (client-callable wrappers)
export async function createSupplier(input: z.infer<typeof SupplierSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createSupplierFlow(input);
}

export async function listSuppliers(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof SupplierProfileSchema>[]> {
    return listSuppliersFlow(input);
}
