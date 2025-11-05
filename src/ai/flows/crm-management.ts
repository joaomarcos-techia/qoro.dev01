
'use server';
/**
 * @fileOverview CRM management flows.
 * - createCustomer - Creates a new customer.
 * - listCustomers - Lists all customers for the user's organization.
 * - getCrmDashboardMetrics - Retrieves key metrics for the CRM dashboard.
 * - createProduct - Creates a new product.
 * - listProducts - Lists all products.
 * - updateProduct - Updates a product.
 * - deleteProduct - Deletes a product.
 * - createService - Creates a new service.
 * - listServices - Lists all services.
 * - updateService - Updates a service.
 * - deleteService - Deletes a service.
 * - createQuote - Creates a new quote.
 * - listQuotes - Lists all quotes.
 * - updateQuote - Updates a quote.
 * - deleteQuote - Deletes a quote.
 * - updateCustomerStatus - Updates the status of a customer.
 * - deleteCustomer - Deletes a customer.
 * - updateCustomer - Updates a customer's profile.
 * - getOrganizationDetails - Fetches details for the user's organization.
 * - markQuoteAsWon - Converts a quote into a bill and updates the quote status.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, ProductSchema, ProductProfileSchema, QuoteSchema, QuoteProfileSchema, UpdateCustomerSchema, UpdateProductSchema, UpdateQuoteSchema, OrganizationProfileSchema, ServiceSchema, ServiceProfileSchema, UpdateServiceSchema } from '@/ai/schemas';
import * as crmService from '@/services/crmService';

const ActorSchema = z.object({ actor: z.string() });

const CrmDashboardMetricsOutputSchema = z.object({
    totalCustomers: z.number(),
    activeLeads: z.number(),
});

const UpdateCustomerStatusInputSchema = z.object({
    customerId: z.string(),
    status: CustomerProfileSchema.shape.status,
}).extend(ActorSchema.shape);


const DeleteCustomerInputSchema = z.object({
    customerId: z.string(),
}).extend(ActorSchema.shape);

const DeleteProductInputSchema = z.object({
    productId: z.string(),
}).extend(ActorSchema.shape);

const DeleteServiceInputSchema = z.object({
    serviceId: z.string(),
}).extend(ActorSchema.shape);

const DeleteQuoteInputSchema = z.object({
    quoteId: z.string(),
}).extend(ActorSchema.shape);

const MarkQuoteAsWonInputSchema = z.object({
    quoteId: z.string(),
    accountId: z.string().optional(),
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

const getCrmDashboardMetricsFlow = ai.defineFlow(
    {
        name: 'getCrmDashboardMetricsFlow',
        inputSchema: ActorSchema,
        outputSchema: CrmDashboardMetricsOutputSchema
    },
    async ({ actor }) => crmService.getCrmDashboardMetrics(actor)
);

const getOrganizationDetailsFlow = ai.defineFlow(
    {
        name: 'getOrganizationDetailsFlow',
        inputSchema: ActorSchema,
        outputSchema: OrganizationProfileSchema
    },
    async ({ actor }) => {
        const orgData = await crmService.getOrganizationDetails(actor);
        return OrganizationProfileSchema.parse(orgData);
    }
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

const updateProductFlow = ai.defineFlow(
    {
        name: 'updateProductFlow',
        inputSchema: UpdateProductSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => crmService.updateProduct(input.id, input, input.actor)
);

const deleteProductFlow = ai.defineFlow(
    {
        name: 'deleteProductFlow',
        inputSchema: DeleteProductInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => crmService.deleteProduct(input.productId, input.actor)
);

// Service Flows
const createServiceFlow = ai.defineFlow(
    {
        name: 'createServiceFlow',
        inputSchema: ServiceSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => crmService.createService(input, input.actor)
);

const listServicesFlow = ai.defineFlow(
    {
        name: 'listServicesFlow',
        inputSchema: ActorSchema,
        outputSchema: z.array(ServiceProfileSchema)
    },
    async ({ actor }) => crmService.listServices(actor)
);

const updateServiceFlow = ai.defineFlow(
    {
        name: 'updateServiceFlow',
        inputSchema: UpdateServiceSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => crmService.updateService(input.id, input, input.actor)
);

const deleteServiceFlow = ai.defineFlow(
    {
        name: 'deleteServiceFlow',
        inputSchema: DeleteServiceInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => crmService.deleteService(input.serviceId, input.actor)
);


const createQuoteFlow = ai.defineFlow(
    {
        name: 'createQuoteFlow',
        inputSchema: QuoteSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string(), number: z.string() })
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

const updateQuoteFlow = ai.defineFlow(
    {
        name: 'updateQuoteFlow',
        inputSchema: UpdateQuoteSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string(), number: z.string() })
    },
    async (input) => crmService.updateQuote(input.id, input, input.actor)
);

const deleteQuoteFlow = ai.defineFlow(
    {
        name: 'deleteQuoteFlow',
        inputSchema: DeleteQuoteInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => crmService.deleteQuote(input.quoteId, input.actor)
);

const markQuoteAsWonFlow = ai.defineFlow(
    {
        name: 'markQuoteAsWonFlow',
        inputSchema: MarkQuoteAsWonInputSchema,
        outputSchema: z.object({ billId: z.string() })
    },
    async (input) => crmService.markQuoteAsWon(input.quoteId, input.accountId, input.actor)
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

export async function getCrmDashboardMetrics(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof CrmDashboardMetricsOutputSchema>> {
    return getCrmDashboardMetricsFlow(input);
}

export async function getOrganizationDetails(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof OrganizationProfileSchema>> {
    return getOrganizationDetailsFlow(input);
}

export async function createProduct(input: z.infer<typeof ProductSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createProductFlow(input);
}

export async function listProducts(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof ProductProfileSchema>[]> {
    return listProductsFlow(input);
}

export async function updateProduct(input: z.infer<typeof UpdateProductSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return updateProductFlow(input);
}

export async function deleteProduct(input: z.infer<typeof DeleteProductInputSchema>): Promise<{ id: string, success: boolean }> {
    return deleteProductFlow(input);
}

export async function createService(input: z.infer<typeof ServiceSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createServiceFlow(input);
}

export async function listServices(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof ServiceProfileSchema>[]> {
    return listServicesFlow(input);
}

export async function updateService(input: z.infer<typeof UpdateServiceSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return updateServiceFlow(input);
}

export async function deleteService(input: z.infer<typeof DeleteServiceInputSchema>): Promise<{ id: string; success: boolean }> {
    return deleteServiceFlow(input);
}

export async function createQuote(input: z.infer<typeof QuoteSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; number: string; }> {
    return createQuoteFlow(input);
}

export async function listQuotes(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof QuoteProfileSchema>[]> {
    return listQuotesFlow(input);
}

export async function updateQuote(input: z.infer<typeof UpdateQuoteSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; number: string; }> {
    return updateQuoteFlow(input);
}

export async function deleteQuote(input: z.infer<typeof DeleteQuoteInputSchema>): Promise<{ id: string; success: boolean; }> {
    return deleteQuoteFlow(input);
}

export async function markQuoteAsWon(input: z.infer<typeof MarkQuoteAsWonInputSchema>): Promise<{ billId: string }> {
    return markQuoteAsWonFlow(input);
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
