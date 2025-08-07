
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AccountSchema, AccountProfileSchema } from '@/ai/schemas';
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

    const accountRef = await adminDb.collection('accounts').add(newAccountData);

    return { id: accountRef.id };
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

export const getDashboardMetrics = async (actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const accountsRef = adminDb.collection('accounts').where('companyId', '==', organizationId);
    const transactionsRef = adminDb.collection('transactions').where('companyId', '==', organizationId);

    // Get date range for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const accountsSnapshot = await accountsRef.get();
    const totalBalance = accountsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().balance || 0), 0);
    
    const incomePromise = transactionsRef
        .where('type', '==', 'income')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .get();

    const expensePromise = transactionsRef
        .where('type', '==', 'expense')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .get();

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
