
'use server';
/**
 * @fileOverview Defines Genkit tools for the Finance module.
 * These tools allow the AI agent (QoroPulse) to interact with financial data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as financeService from '@/services/financeService';
import { AccountProfileSchema } from '@/ai/schemas';

const FinanceSummarySchema = z.object({
    totalBalance: z.number(),
    totalIncome: z.number(),
    totalExpense: z.number(),
    netProfit: z.number(),
});

// Define the tool for listing financial accounts
export const listAccountsTool = ai.defineTool(
    {
        name: 'listAccountsTool',
        description: 'Lista todas as contas financeiras da organização, como contas correntes, poupanças, cartões de crédito e caixas. Use para responder perguntas sobre contas bancárias ou saldos individuais.',
        inputSchema: z.object({}), // No specific input needed from the AI
        outputSchema: z.array(AccountProfileSchema),
    },
    async (_, context) => {
        // The actor's UID is passed in the context by the flow
        if (!context?.actor) {
            throw new Error('User authentication is required to list financial accounts.');
        }
        return financeService.listAccounts(context.actor);
    }
);

// Define the tool for getting a financial summary
export const getFinanceSummaryTool = ai.defineTool(
    {
        name: 'getFinanceSummaryTool',
        description: 'Recupera um resumo da saúde financeira atual da organização, incluindo saldo total, receita total do mês atual, despesas totais do mês atual e o lucro líquido resultante. Use para perguntas de alto nível sobre desempenho financeiro.',
        inputSchema: z.object({}), // No specific input needed from the AI
        outputSchema: FinanceSummarySchema,
    },
    async (_, context) => {
        // The actor's UID is passed in the context by the flow
        if (!context?.actor) {
            throw new Error('User authentication is required to get a financial summary.');
        }
        return financeService.getFinanceDashboardMetrics(context.actor);
    }
);
