
'use server';
/**
 * @fileOverview CRM management flows.
 * - createCustomer - Creates a new customer.
 * - listCustomers - Lists all customers for the user's organization.
 * - createSaleLead - Creates a new sale lead.
 * - listSaleLeads - Lists all sales leads for the user's organization.
 * - getDashboardMetrics - Retrieves key metrics for the CRM dashboard.
 * - createProduct - Creates a new product.
 * - listProducts - Lists all products.
 * - createQuote - Creates a new quote.
 * - listQuotes - Lists all quotes.
 * - updateCustomerStatus - Updates the status of a customer.
 * - deleteCustomer - Deletes a customer.
 * - updateCustomer - Updates a customer's profile.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, SaleLeadSchema, SaleLeadProfileSchema, ProductSchema, ProductProfileSchema, QuoteSchema, QuoteProfileSchema, UpdateCustomerSchema } from '@/ai/schemas';
import * as crmService from '@/services/crmService';

const ActorSchema = z.object({ actor: z.string() });

const DashboardMetricsOutputSchema = z.object({
    customers: z.array(CustomerProfileSchema),
    leads: z.array(SaleLeadProfileSchema),
});

const UpdateCustomerStatusInputSchema = z.object({
    customerId: z.string(),
    status: CustomerProfileSchema.shape.status,
}).extend(ActorSchema.shape);

const DeleteCustomerInputSchema = z.object({
    customerId: z.string(),
}).extend(ActorSchema.shape);


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

const createSaleLeadFlow = ai.defineFlow(
    {
        name: 'createSaleLeadFlow',
        inputSchema: SaleLeadSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => crmService.createSaleLead(input, input.actor)
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

const createProductFlow = ai.defineFlow(
    {
        name: 'createProductFlow',
        inputSchema: ProductSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => crmService.createProduct(input, input.actor)
);

const listProductsFlow = ai.defineFlow(
    {
        name: 'listProductsFlow',
        inputSchema: ActorSchema,
        outputSchema: z.array(ProductProfileSchema)
    },
    async ({ actor }) => crmService.listProducts(actor)
);

const createQuoteFlow = ai.defineFlow(
    {
        name: 'createQuoteFlow',
        inputSchema: QuoteSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => crmService.createQuote(input, input.actor)
);

const listQuotesFlow = ai.defineFlow(
    {
        name: 'listQuotesFlow',
        inputSchema: ActorSchema,
        outputSchema: z.array(QuoteProfileSchema)
    },
    async ({ actor }) => crmService.listQuotes(actor)
);

const updateCustomerStatusFlow = ai.defineFlow(
    {
        name: 'updateCustomerStatusFlow',
        inputSchema: UpdateCustomerStatusInputSchema,
        outputSchema: z.object({ id: z.string(), status: CustomerProfileSchema.shape.status })
    },
    async (input) => crmService.updateCustomerStatus(input.customerId, input.status, input.actor)
);

const deleteCustomerFlow = ai.defineFlow(
    {
        name: 'deleteCustomerFlow',
        inputSchema: DeleteCustomerInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => crmService.deleteCustomer(input.customerId, input.actor)
);

const updateCustomerFlow = ai.defineFlow(
    {
        name: 'updateCustomerFlow',
        inputSchema: UpdateCustomerSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => crmService.updateCustomer(input.id, input, input.actor)
);


// Exported functions (client-callable wrappers)
export async function createCustomer(input: z.infer<typeof CustomerSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createCustomerFlow(input);
}

export async function listCustomers(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof CustomerProfileSchema>[]> {
    return listCustomersFlow(input);
}

export async function createSaleLead(input: z.infer<typeof SaleLeadSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createSaleLeadFlow(input);
}

export async function listSaleLeads(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof SaleLeadProfileSchema>[]> {
    return listSaleLeadsFlow(input);
}

export async function getDashboardMetrics(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof DashboardMetricsOutputSchema>> {
    return getDashboardMetricsFlow(input);
}

export async function createProduct(input: z.infer<typeof ProductSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createProductFlow(input);
}

export async function listProducts(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof ProductProfileSchema>[]> {
    return listProductsFlow(input);
}

export async function createQuote(input: z.infer<typeof QuoteSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createQuoteFlow(input);
}

export async function listQuotes(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof QuoteProfileSchema>[]> {
    return listQuotesFlow(input);
}

export async function updateCustomerStatus(input: z.infer<typeof UpdateCustomerStatusInputSchema>): Promise<{ id: string; status: z.infer<typeof CustomerProfileSchema>['status'] }> {
    return updateCustomerStatusFlow(input);
}

export async function deleteCustomer(input: z.infer<typeof DeleteCustomerInputSchema>): Promise<{ id: string; success: boolean }> {
    return deleteCustomerFlow(input);
}

export async function updateCustomer(input: z.infer<typeof UpdateCustomerSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return updateCustomerFlow(input);
}
