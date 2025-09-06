
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AccountSchema, AccountProfileSchema, UpdateAccountSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createAccount = async (input: z.infer<typeof AccountSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newAccountData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    try {
        const accountRef = await adminDb.collection('accounts').add(newAccountData);
        return { id: accountRef.id };
    } catch (error: any) {
        console.error("Erro ao criar conta no Firestore:", error, error.stack);
        throw new Error("Falha ao salvar a conta no banco de dados. Tente novamente mais tarde.");
    }
};


export const listAccounts = async (actorUid: string): Promise<z.infer<typeof AccountProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    try {
        const accountsSnapshot = await adminDb.collection('accounts')
                                         .where('companyId', '==', organizationId)
                                         .orderBy('createdAt', 'desc')
                                         .get();
        
        if (accountsSnapshot.empty) {
            return [];
        }
        
        const accounts: z.infer<typeof AccountProfileSchema>[] = accountsSnapshot.docs.map(doc => {
            const data = doc.data();
            const parsedData = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            };
    
            return AccountProfileSchema.parse(parsedData);
        });
        
        return accounts;
    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        // Lançar um erro mais genérico para o cliente, mas logar o erro real no servidor
        throw new Error("Não foi possível carregar as contas financeiras devido a um erro no servidor.");
    }
};

export const updateAccount = async (accountId: string, input: z.infer<typeof UpdateAccountSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const accountRef = adminDb.collection('accounts').doc(accountId);

    const accountDoc = await accountRef.get();
    if (!accountDoc.exists || accountDoc.data()?.companyId !== organizationId) {
        throw new Error('Conta não encontrada ou acesso negado.');
    }

    const { id, ...updateData } = input;

    await accountRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: accountId };
};

export const deleteAccount = async (accountId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const accountRef = adminDb.collection('accounts').doc(accountId);

    const accountDoc = await accountRef.get();
    if (!accountDoc.exists || accountDoc.data()?.companyId !== organizationId) {
        throw new Error('Conta não encontrada ou acesso negado.');
    }
    
    // Security check: prevent deletion if transactions are associated with the account
    const transactionsSnapshot = await adminDb.collection('transactions')
                                            .where('accountId', '==', accountId)
                                            .limit(1)
                                            .get();

    if (!transactionsSnapshot.empty) {
        throw new Error("Não é possível excluir a conta, pois existem transações associadas a ela.");
    }


    await accountRef.delete();

    return { id: accountId, success: true };
};


export const getFinanceDashboardMetrics = async (actorUid: string, dateRange?: { from?: string; to?: string }) => {
    const accounts = await listAccounts(actorUid);
    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    
    // For dashboard summary, we only need the total balance.
    // The more detailed metrics are used in the finance reports page.
    if (!dateRange) {
        return {
            totalBalance,
            totalIncome: 0, // default value
            totalExpense: 0, // default value
            netProfit: 0, // default value
        }
    }
    
    // Logic for detailed report with date range
    const { organizationId } = await getAdminAndOrg(actorUid);
    let transactionsQuery = adminDb.collection('transactions').where('companyId', '==', organizationId);
    if (dateRange?.from) {
        transactionsQuery = transactionsQuery.where('date', '>=', new Date(dateRange.from));
    }
    if (dateRange?.to) {
        transactionsQuery = transactionsQuery.where('date', '<=', new Date(dateRange.to));
    }

    const incomePromise = transactionsQuery.where('type', '==', 'income').get();
    const expensePromise = transactionsQuery.where('type', '==', 'expense').get();
    const [incomeSnapshot, expenseSnapshot] = await Promise.all([incomePromise, expensePromise]);

    const totalIncome = incomeSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const totalExpense = expenseSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const netProfit = totalIncome - totalExpense;
    
    return {
        totalBalance,
        totalIncome,
        totalExpense,
        netProfit,
    };
};
