
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TransactionSchema, TransactionProfileSchema, TransactionProfile, UpdateTransactionSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';


export const createTransaction = async (input: z.infer<typeof TransactionSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const accountRef = adminDb.collection('accounts').doc(input.accountId);
    const transactionRef = adminDb.collection('transactions').doc();

    try {
        await adminDb.runTransaction(async (t) => {
            const accountDoc = await t.get(accountRef);
            if (!accountDoc.exists) {
                throw new Error("A conta financeira especificada não foi encontrada.");
            }

            const accountData = accountDoc.data()!;
            if (accountData.companyId !== organizationId) {
                throw new Error("A conta especificada não pertence a esta organização.");
            }

            const currentBalance = accountData.balance || 0;
            const transactionAmount = input.amount;

            let newBalance;
            if (input.type === 'income') {
                newBalance = currentBalance + transactionAmount;
            } else {
                newBalance = currentBalance - transactionAmount;
            }

            t.update(accountRef, { balance: newBalance });

            const newTransactionData = {
                ...input,
                companyId: organizationId,
                createdBy: actorUid,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };
            t.set(transactionRef, newTransactionData);
        });

        return { id: transactionRef.id };
    } catch (error: any) {
        console.error("Erro ao criar transação no Firestore:", error, error.stack);
        throw new Error(`Falha ao salvar a transação no banco de dados: ${error.message}`);
    }
};

export const updateTransaction = async (input: z.infer<typeof UpdateTransactionSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const { id: transactionId, ...updateData } = input;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    try {
        await adminDb.runTransaction(async (t) => {
            const transactionDoc = await t.get(transactionRef);
            if (!transactionDoc.exists) {
                throw new Error("Transação não encontrada.");
            }
            const oldData = transactionDoc.data();
            if (oldData?.companyId !== organizationId) {
                throw new Error("Acesso negado à transação.");
            }

            const oldAmount = Number(oldData?.amount || 0);
            const newAmount = Number(updateData.amount || 0);

            const oldAccountRef = adminDb.collection('accounts').doc(oldData?.accountId);
            const newAccountRef = adminDb.collection('accounts').doc(updateData.accountId);
            
            const oldAccountDoc = await t.get(oldAccountRef);
            if (!oldAccountDoc.exists) throw new Error("Conta antiga não encontrada.");
            let oldAccountBalance = oldAccountDoc.data()!.balance;
            // Revert old transaction amount
            oldAccountBalance += (oldData?.type === 'expense' ? oldAmount : -oldAmount);
            
            // If account is the same, use the already reverted balance
            if (oldData?.accountId === updateData.accountId) {
                const newBalance = oldAccountBalance + (updateData.type === 'income' ? newAmount : -newAmount);
                t.update(newAccountRef, { balance: newBalance });
            } else {
                // If account is different, update both
                const newAccountDoc = await t.get(newAccountRef);
                if (!newAccountDoc.exists) throw new Error("Nova conta não encontrada.");
                let newAccountBalance = newAccountDoc.data()!.balance;
                newAccountBalance += (updateData.type === 'income' ? newAmount : -newAmount);

                t.update(oldAccountRef, { balance: oldAccountBalance });
                t.update(newAccountRef, { balance: newAccountBalance });
            }
            
            t.update(transactionRef, { ...updateData, updatedAt: FieldValue.serverTimestamp() });
        });
        return { id: transactionId };
    } catch (error: any) {
        console.error("Erro ao atualizar transação no Firestore:", error, error.stack);
        throw new Error(`Falha ao atualizar a transação: ${error.message}`);
    }
};


export const deleteTransaction = async (transactionId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const transactionRef = adminDb.collection('transactions').doc(transactionId);

    try {
        await adminDb.runTransaction(async (t) => {
            const transactionDoc = await t.get(transactionRef);
            if (!transactionDoc.exists) {
                throw new Error("Transação não encontrada.");
            }
            const data = transactionDoc.data()!;
            if (data.companyId !== organizationId) {
                throw new Error("Acesso negado à transação.");
            }

            const accountRef = adminDb.collection('accounts').doc(data.accountId);
            const accountDoc = await t.get(accountRef);
            if (accountDoc.exists) {
                const accountData = accountDoc.data()!;
                const currentBalance = accountData.balance;
                const newBalance = data.type === 'income' ? currentBalance - data.amount : currentBalance + data.amount;
                t.update(accountRef, { balance: newBalance });
            }

            t.delete(transactionRef);
        });

        return { id: transactionId, success: true };
    } catch (error: any) {
        console.error("Erro ao excluir transação:", error, error.stack);
        throw new Error(`Falha ao excluir a transação: ${error.message}`);
    }
};


export const listTransactions = async (
    actorUid: string, 
    dateRange?: { from?: string; to?: string },
    accountId?: string
): Promise<TransactionProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    let query = adminDb.collection('transactions')
                      .where('companyId', '==', organizationId);
    
    if (accountId) {
        query = query.where('accountId', '==', accountId);
    }
    
    if (dateRange?.from) {
        query = query.where('date', '>=', new Date(dateRange.from));
    }
    if (dateRange?.to) {
        query = query.where('date', '<=', new Date(dateRange.to));
    }

    query = query.orderBy('date', 'desc');

    const transactionsSnapshot = await query.get();
    
    if (transactionsSnapshot.empty) {
        return [];
    }
    
    const accountIds = [...new Set(transactionsSnapshot.docs.map(doc => doc.data().accountId).filter(id => id))];
    const customerIds = [...new Set(transactionsSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    
    const accounts: Record<string, { name?: string }> = {};
    const customers: Record<string, { name?: string }> = {};

    if (accountIds.length > 0) {
        const accountsSnapshot = await adminDb.collection('accounts').where('__name__', 'in', accountIds).get();
        accountsSnapshot.forEach(doc => {
            accounts[doc.id] = { name: doc.data().name };
        });
    }

    if (customerIds.length > 0) {
        const customersSnapshot = await adminDb.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => {
            customers[doc.id] = { name: doc.data().name };
        });
    }

    const transactions: TransactionProfile[] = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        const accountInfo = accounts[data.accountId] || {};
        const customerInfo = customers[data.customerId] || {};
        
        // Handle both Firestore Timestamps and ISO strings
        const date = data.date ? (typeof data.date.toDate === 'function' ? data.date.toDate() : new Date(data.date)) : new Date();

        const parsedData = TransactionProfileSchema.parse({
            id: doc.id,
            ...data,
            date,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            accountName: accountInfo.name,
            customerName: customerInfo.name,
        });

        return {
            ...parsedData,
            date: parsedData.date.toISOString(),
        };
    });
    
    return transactions;
};
