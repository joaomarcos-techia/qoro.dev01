import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TransactionSchema, TransactionProfileSchema, TransactionProfile } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';

const db = getFirestore();

export const createTransaction = async (input: z.infer<typeof TransactionSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const accountRef = db.collection('accounts').doc(input.accountId);
    const transactionRef = db.collection('transactions').doc(); // Create a new ref for the transaction

    await db.runTransaction(async (t) => {
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

        // Update the account balance
        t.update(accountRef, { balance: newBalance });

        // Create the new transaction
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
};


export const listTransactions = async (actorUid: string): Promise<TransactionProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const transactionsSnapshot = await db.collection('transactions')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('date', 'desc')
                                     .get();
    
    if (transactionsSnapshot.empty) {
        return [];
    }
    
    // Denormalization: Fetch account and customer names
    const accountIds = [...new Set(transactionsSnapshot.docs.map(doc => doc.data().accountId).filter(id => id))];
    const customerIds = [...new Set(transactionsSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    
    const accounts: Record<string, { name?: string }> = {};
    const customers: Record<string, { name?: string }> = {};

    if (accountIds.length > 0) {
        const accountsSnapshot = await db.collection('accounts').where('__name__', 'in', accountIds).get();
        accountsSnapshot.forEach(doc => {
            accounts[doc.id] = { name: doc.data().name };
        });
    }

    if (customerIds.length > 0) {
        const customersSnapshot = await db.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => {
            customers[doc.id] = { name: doc.data().name };
        });
    }

    const transactions: TransactionProfile[] = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        const accountInfo = accounts[data.accountId] || {};
        const customerInfo = customers[data.customerId] || {};
        const date = data.date ? data.date.toDate() : new Date();

        const parsedData = TransactionProfileSchema.parse({
            id: doc.id,
            ...data,
            date,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            accountName: accountInfo.name,
            customerName: customerInfo.name,
        });

        // Convert Date object back to ISO string for the client
        return {
            ...parsedData,
            date: parsedData.date.toISOString(),
        };
    });
    
    return transactions;
};
