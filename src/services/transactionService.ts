
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TransactionSchema, TransactionProfile, UpdateTransactionSchema, TransactionProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

const FREE_PLAN_LIMITS = {
    transactions: 10,
};

export const createTransaction = async (input: z.infer<typeof TransactionSchema>, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId, planId } = adminOrgData;

    if (planId === 'free') {
        const query = adminDb.collection('transactions').where('companyId', '==', organizationId);
        const snapshot = await query.count().get();
        const count = snapshot.data().count;
        if (count >= FREE_PLAN_LIMITS.transactions) {
            throw new Error(`Limite de ${FREE_PLAN_LIMITS.transactions} transações atingido no plano gratuito. Faça upgrade para adicionar mais.`);
        }
    }

    const accountId = input.accountId;
    const transactionRef = adminDb.collection('transactions').doc();

    // Remove undefined values before sending to Firestore
    const cleanInput = JSON.parse(JSON.stringify(input));
    // Always set status to paid
    cleanInput.status = 'paid';

    try {
        if (accountId) {
            const accountRef = adminDb.collection('accounts').doc(accountId);
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
                const transactionAmount = cleanInput.amount;

                let newBalance;
                if (cleanInput.type === 'income') {
                    newBalance = currentBalance + transactionAmount;
                } else {
                    newBalance = currentBalance - transactionAmount;
                }

                t.update(accountRef, { balance: newBalance });

                const newTransactionData = {
                    ...cleanInput,
                    date: cleanInput.date ? new Date(cleanInput.date) : new Date(),
                    companyId: organizationId,
                    createdBy: actorUid,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                };
                t.set(transactionRef, newTransactionData);
            });
        } else {
            // Create transaction without updating account balance
            const newTransactionData = {
                ...cleanInput,
                date: cleanInput.date ? new Date(cleanInput.date) : new Date(),
                companyId: organizationId,
                createdBy: actorUid,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };
            await transactionRef.set(newTransactionData);
        }

        return { id: transactionRef.id };
    } catch (error: any) {
        console.error("Erro ao criar transação no Firestore:", error, error.stack);
        throw new Error(`Falha ao salvar a transação no banco de dados: ${error.message}`);
    }
};

export const updateTransaction = async (input: z.infer<typeof UpdateTransactionSchema>, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

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
            const oldAccountId = oldData?.accountId;
            const newAccountId = updateData.accountId;

            // Revert old transaction from old account if it exists
            if (oldAccountId) {
                const oldAccountRef = adminDb.collection('accounts').doc(oldAccountId);
                const oldAccountDoc = await t.get(oldAccountRef);
                if (oldAccountDoc.exists) {
                    let oldAccountBalance = oldAccountDoc.data()!.balance;
                    oldAccountBalance += (oldData?.type === 'expense' ? oldAmount : -oldAmount);
                    t.update(oldAccountRef, { balance: oldAccountBalance });
                }
            }

            // Apply new transaction to new account if it exists
            if (newAccountId) {
                const newAccountRef = adminDb.collection('accounts').doc(newAccountId);
                const newAccountDoc = await t.get(newAccountRef);
                if (!newAccountDoc.exists) throw new Error("Nova conta não encontrada.");
                let newAccountBalance = newAccountDoc.data()!.balance;
                newAccountBalance += (updateData.type === 'income' ? newAmount : -newAmount);
                t.update(newAccountRef, { balance: newAccountBalance });
            }
            
            t.update(transactionRef, { ...updateData, status: 'paid', updatedAt: FieldValue.serverTimestamp() });
        });
        return { id: transactionId };
    } catch (error: any) {
        console.error("Erro ao atualizar transação no Firestore:", error, error.stack);
        throw new Error(`Falha ao atualizar a transação: ${error.message}`);
    }
};

export const deleteTransaction = async (transactionId: string, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

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

            if (data.accountId) {
                const accountRef = adminDb.collection('accounts').doc(data.accountId);
                const accountDoc = await t.get(accountRef);
                if (accountDoc.exists) {
                    const accountData = accountDoc.data()!;
                    const currentBalance = accountData.balance;
                    const newBalance = data.type === 'income' ? currentBalance - data.amount : currentBalance + data.amount;
                    t.update(accountRef, { balance: newBalance });
                }
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
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) return [];
    const { organizationId } = adminOrgData;
    
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
        
        const date = data.date?.toDate ? data.date.toDate() : new Date();

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
            date: typeof parsedData.date === 'string' 
                ? parsedData.date 
                : parsedData.date?.toISOString() ?? new Date().toISOString(),
        };
    });
    
    return transactions;
};

export const bulkCreateTransactions = async (
    transactions: z.infer<typeof TransactionSchema>[],
    accountId: string,
    actorUid: string
) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

    const accountRef = adminDb.collection('accounts').doc(accountId);

    try {
        await adminDb.runTransaction(async (t) => {
            const accountDoc = await t.get(accountRef);
            if (!accountDoc.exists) {
                throw new Error("A conta financeira especificada não foi encontrada.");
            }
            if (accountDoc.data()?.companyId !== organizationId) {
                throw new Error("A conta especificada não pertence a esta organização.");
            }

            let newBalance = accountDoc.data()?.balance || 0;

            for (const transaction of transactions) {
                const transactionAmount = transaction.amount;
                if (transaction.type === 'income') {
                    newBalance += transactionAmount;
                } else {
                    newBalance -= transactionAmount;
                }

                // Garante que a data seja um objeto Date do Firestore
                const transactionDate = new Date(transaction.date as string | Date);
                if (isNaN(transactionDate.getTime())) {
                    throw new Error(`Data inválida fornecida para a transação: ${transaction.description}`);
                }

                const newTransactionData = {
                    ...transaction,
                    date: transactionDate,
                    status: 'paid',
                    accountId,
                    companyId: organizationId,
                    createdBy: actorUid,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                };
                const transactionRef = adminDb.collection('transactions').doc();
                t.set(transactionRef, newTransactionData);
            }

            t.update(accountRef, { balance: newBalance });
        });

        return { count: transactions.length };
    } catch (error: any) {
        console.error("Erro na criação em massa de transações:", error);
        throw new Error(`Falha ao salvar as transações: ${error.message}`);
    }
};

    

    

  
