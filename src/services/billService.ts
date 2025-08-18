
'use server';
/**
 * @fileOverview Service for managing bills (accounts payable/receivable) in Firestore.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { BillSchema, BillProfileSchema, UpdateBillSchema, TransactionSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';
import * as transactionService from './transactionService';

export const createBill = async (input: z.infer<typeof BillSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newBillData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const billRef = await adminDb.collection('bills').add(newBillData);
    return { id: billRef.id };
};

export const listBills = async (actorUid: string): Promise<z.infer<typeof BillProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const billsSnapshot = await adminDb.collection('bills')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('dueDate', 'desc')
                                     .get();
    
    if (billsSnapshot.empty) {
        return [];
    }
    
    const customerIds = [...new Set(billsSnapshot.docs.map(doc => doc.data().entityType === 'customer' ? doc.data().entityId : null).filter(Boolean))];
    const supplierIds = [...new Set(billsSnapshot.docs.map(doc => doc.data().entityType === 'supplier' ? doc.data().entityId : null).filter(Boolean))];

    const customers: Record<string, string> = {};
    const suppliers: Record<string, string> = {};

    if (customerIds.length > 0) {
        const customersSnapshot = await adminDb.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => {
            customers[doc.id] = doc.data().name;
        });
    }
    if (supplierIds.length > 0) {
        const suppliersSnapshot = await adminDb.collection('suppliers').where('__name__', 'in', supplierIds).get();
        suppliersSnapshot.forEach(doc => {
            suppliers[doc.id] = doc.data().name;
        });
    }

    const bills: z.infer<typeof BillProfileSchema>[] = billsSnapshot.docs.map(doc => {
        const data = doc.data();
        let entityName = '';
        if (data.entityId) {
            entityName = data.entityType === 'customer' ? customers[data.entityId] : suppliers[data.entityId];
        }

        const rawData = {
            id: doc.id,
            ...data,
            dueDate: data.dueDate?.toDate().toISOString(),
            createdAt: data.createdAt?.toDate().toISOString(),
            entityName: entityName || undefined,
        };

        return BillProfileSchema.parse(rawData);
    });
    
    return bills;
};

export const updateBill = async (input: z.infer<typeof UpdateBillSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const { id, ...updateData } = input;
    const billRef = adminDb.collection('bills').doc(id);

    const doc = await billRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error("Conta não encontrada ou acesso negado.");
    }
    const oldStatus = doc.data()?.status;
    
    await billRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    if (updateData.status === 'paid' && oldStatus !== 'paid') {
        const accounts = await adminDb.collection('accounts').where('companyId', '==', organizationId).limit(1).get();
        if (accounts.empty) {
            throw new Error("Nenhuma conta financeira encontrada para registrar o pagamento. Crie uma conta primeiro.");
        }
        const primaryAccountId = accounts.docs[0].id;
        
        const transactionData: z.infer<typeof TransactionSchema> = {
            accountId: primaryAccountId,
            type: updateData.type === 'payable' ? 'expense' : 'income',
            amount: updateData.amount,
            description: `Pagamento: ${updateData.description}`,
            date: new Date(),
            category: updateData.type === 'payable' ? 'Pagamento de Contas' : 'Recebimento de Contas',
            status: 'paid',
            paymentMethod: 'bank_transfer',
            customerId: updateData.entityType === 'customer' ? updateData.entityId : undefined,
        };
        await transactionService.createTransaction(transactionData, actorUid);
    }

    return { id };
};

export const deleteBill = async (billId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const billRef = adminDb.collection('bills').doc(billId);

    const doc = await billRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error("Conta não encontrada ou acesso negado.");
    }

    await billRef.delete();
    return { id: billId, success: true };
};
