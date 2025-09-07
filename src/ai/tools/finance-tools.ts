
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
    totalBalance: z.number().describe("O saldo total somando todas as contas financeiras da empresa."),
    totalIncome: z.number().describe("A receita total (entradas) registrada no período consultado."),
    totalExpense: z.number().describe("A despesa total (saídas) registrada no período consultado."),
    netProfit: z.number().describe("O lucro líquido, calculado como Receita Total - Despesa Total."),
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
        description: 'Recupera um resumo da saúde financeira da organização, incluindo saldo total em todas as contas, receita total, despesas totais e o lucro líquido do mês atual. Use para perguntas de alto nível sobre desempenho financeiro, como "qual o balanço da empresa?", "como estão as finanças?" ou para obter o saldo total da empresa.',
        inputSchema: z.object({}), // No specific input needed from the AI
        outputSchema: FinanceSummarySchema,
    },
    async (_, context) => {
        // The actor's UID is passed in the context by the flow
        if (!context?.actor) {
            throw new Error('User authentication is required to get a financial summary.');
        }
        // By default, gets metrics for the current month if no date range is passed
        return financeService.getFinanceDashboardMetrics(context.actor);
    }
);
