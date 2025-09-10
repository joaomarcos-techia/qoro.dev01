
'use server';
/**
 * @fileOverview Defines Genkit tools for the CRM module.
 * These tools allow the AI agent (QoroPulse) to interact with CRM data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as crmService from '@/services/crmService';

const CrmSummaryDataSchema = z.object({
    totalCustomers: z.number().describe("O número total de clientes cadastrados no sistema."),
    activeLeads: z.number().describe("O número de clientes que estão atualmente em alguma etapa do funil de vendas (excluindo ganhos e perdidos)."),
});

// Define the single, authoritative tool for getting all relevant CRM data for Pulse.
export const getCrmSummaryTool = ai.defineTool(
    {
        name: 'getCrmSummary',
        description: 'Use esta ferramenta para obter um resumo dos dados de clientes (CRM). Retorna o número total de clientes e a quantidade de leads ativos no funil de vendas. É a ferramenta principal para perguntas sobre o estado geral dos clientes e do funil.',
        inputSchema: z.object({}),
        outputSchema: CrmSummaryDataSchema,
    },
    async (_, context) => {
        if (!context?.actor) {
            throw new Error('Autenticação do usuário é necessária para obter dados do CRM.');
        }
        // This now calls the centralized service function, ensuring consistency.
        const metrics = await crmService.getCrmDashboardMetrics(context.actor);
        return { totalCustomers: metrics.totalCustomers, activeLeads: metrics.activeLeads };
    }
);
