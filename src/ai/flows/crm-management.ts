'use server';
/**
 * @fileOverview CRM management flows.
 * - createCustomer - Creates a new customer.
 * - listCustomers - Lists all customers for the user's organization.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema } from '@/ai/schemas';
import * as crmService from '@/services/crmService';

const ActorSchema = z.object({ actor: z.string() });

// Define flows
const createCustomerFlow = ai.defineFlow(
    { 
        name: 'createCustomerFlow', 
        inputSchema: CustomerSchema.extend(ActorSchema.shape), 
        outputSchema: z.object({ id: z.string() }) 
    },
    async (input) => crmService.createCustomer(input, input.actor)
);

const listCustomersFlow = ai.defineFlow(
    { 
        name: 'listCustomersFlow', 
        inputSchema: ActorSchema, 
        outputSchema: z.array(CustomerProfileSchema) 
    },
    async ({ actor }) => crmService.listCustomers(actor)
);

// Exported functions (client-callable wrappers)
export async function createCustomer(input: z.infer<typeof CustomerSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createCustomerFlow(input);
}

export async function listCustomers(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof CustomerProfileSchema>[]> {
    return listCustomersFlow(input);
}
