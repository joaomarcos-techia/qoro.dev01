
'use server';
/**
 * @fileOverview Defines Genkit tools for the CRM module.
 * These tools allow the AI agent (QoroPulse) to interact with CRM data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as crmService from '@/services/crmService';
import type { CustomerProfile } from '@/ai/schemas';

const CrmDataSchema = z.object({
    totalCustomers: z.number().describe("O número total de clientes cadastrados no sistema."),
    funnelSummary: z.record(z.string(), z.number()).describe("Um objeto mostrando a contagem de clientes em cada estágio do funil de vendas (ex: { 'Novo': 10, 'Qualificação': 5 })."),
});

// Define the single, authoritative tool for getting all relevant CRM data for Pulse.
export const getCrmSummaryTool = ai.defineTool(
    {
        name: 'getCrmSummaryTool',
        description: 'Use esta ferramenta para obter um resumo completo e numérico do CRM, incluindo o número total de clientes e a distribuição deles no funil de vendas. É a ferramenta principal para perguntas sobre clientes.',
        inputSchema: z.object({}),
        outputSchema: CrmDataSchema,
    },
    async (_, context) => {
        if (!context?.actor) {
            throw new Error('Autenticação do usuário é necessária para obter dados do CRM.');
        }
        const customers = await crmService.listCustomers(context.actor);
        const totalCustomers = customers.length;
        
        const funnelStatuses: CustomerProfile['status'][] = ['new', 'initial_contact', 'qualification', 'proposal', 'negotiation'];
        
        const funnelSummary = customers
            .filter(c => funnelStatuses.includes(c.status))
            .reduce((acc, customer) => {
                const status = customer.status || 'Desconhecido';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        return {
            totalCustomers,
            funnelSummary,
        };
    }
);

