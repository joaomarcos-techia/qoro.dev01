
'use server';
/**
 * @fileOverview CRM management flows.
 * - createCustomer - Creates a new customer.
 * - listCustomers - Lists all customers for the user's organization.
 * - listSaleLeads - Lists all sales leads for the user's organization.
 * - getDashboardMetrics - Retrieves key metrics for the CRM dashboard.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, SaleLeadProfileSchema } from '@/ai/schemas';
import * as crmService from '@/services/crmService';

const ActorSchema = z.object({ actor: z.string() });

const DashboardMetricsOutputSchema = z.object({
    totalCustomers: z.number(),
    totalLeads: z.number(),
});

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

const listSaleLeadsFlow = ai.defineFlow(
    {
        name: 'listSaleLeadsFlow',
        inputSchema: ActorSchema,
        outputSchema: z.array(SaleLeadProfileSchema)
    },
    async ({ actor }) => crmService.listSaleLeads(actor)
);

const getDashboardMetricsFlow = ai.defineFlow(
    {
        name: 'getCrmDashboardMetricsFlow',
        inputSchema: ActorSchema,
        outputSchema: DashboardMetricsOutputSchema
    },
    async ({ actor }) => crmService.getDashboardMetrics(actor)
);


// Exported functions (client-callable wrappers)
export async function createCustomer(input: z.infer<typeof CustomerSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createCustomerFlow(input);
}

export async function listCustomers(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof CustomerProfileSchema>[]> {
    return listCustomersFlow(input);
}

export async function listSaleLeads(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof SaleLeadProfileSchema>[]> {
    return listSaleLeadsFlow(input);
}

export async function getDashboardMetrics(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof DashboardMetricsOutputSchema>> {
    return getDashboardMetricsFlow(input);
}
