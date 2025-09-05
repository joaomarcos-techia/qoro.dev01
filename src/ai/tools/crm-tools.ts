
'use server';
/**
 * @fileOverview Defines Genkit tools for the CRM module.
 * These tools allow the AI agent (QoroPulse) to interact with CRM data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as crmService from '@/services/crmService';
import { CustomerProfileSchema } from '@/ai/schemas';
import type { CustomerProfile } from '@/ai/schemas';

// Define the tool for listing customers - kept for potential future use but removed from Pulse
export const listCustomersTool = ai.defineTool(
    {
        name: 'listCustomersTool',
        description: 'Use esta ferramenta para obter uma LISTA COMPLETA de todos os clientes. É útil para responder a perguntas sobre a QUANTIDADE de clientes (você deve contar os itens da lista) ou para obter detalhes específicos sobre eles.',
        inputSchema: z.object({}),
        outputSchema: z.array(CustomerProfileSchema),
    },
    async (_, context) => {
        if (!context?.actor) {
            throw new Error('Autenticação do usuário é necessária para listar clientes.');
        }
        return crmService.listCustomers(context.actor);
    }
);


const CrmSummarySchema = z.object({
    totalCustomers: z.number().describe("O número total de clientes cadastrados no sistema."),
    customersInFunnel: z.number().describe("O número de clientes que estão atualmente em alguma etapa do funil de vendas (não ganhos, perdidos ou arquivados)."),
    customersByStatus: z.record(z.string(), z.number()).describe("Um objeto mostrando a contagem de clientes em cada estágio do funil de vendas (ex: { 'Novo': 10, 'Qualificação': 5 })."),
});

// Define a new, more efficient tool for getting a CRM summary
export const getCrmSummaryTool = ai.defineTool(
    {
        name: 'getCrmSummaryTool',
        description: 'Recupera um RESUMO NUMÉRICO do CRM, incluindo o número total de clientes, a quantidade de clientes no funil e a contagem por status. Use esta ferramenta para responder a qualquer pergunta sobre quantidade de clientes ou sobre o funil de vendas.',
        inputSchema: z.object({}),
        outputSchema: CrmSummarySchema,
    },
    async (_, context) => {
        if (!context?.actor) {
            throw new Error('Autenticação do usuário é necessária para obter o resumo do CRM.');
        }
        const customers = await crmService.listCustomers(context.actor);
        const funnelStatuses: CustomerProfile['status'][] = ['new', 'initial_contact', 'qualification', 'proposal', 'negotiation'];
        
        const funnelCustomers = customers.filter(c => funnelStatuses.includes(c.status));

        const customersInFunnel = funnelCustomers.length;

        const customersByStatus = funnelCustomers.reduce((acc, customer) => {
            const status = customer.status || 'Desconhecido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalCustomers: customers.length,
            customersInFunnel,
            customersByStatus,
        };
    }
);
