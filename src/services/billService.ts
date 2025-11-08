

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
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

    // Robust date handling
    let dueDate: Date;
    if (input.dueDate instanceof Date) {
        dueDate = input.dueDate;
    } else if (typeof input.dueDate === 'string') {
        dueDate = new Date(input.dueDate);
    } else {
        throw new Error("Invalid dueDate format");
    }

    const newBillData = {
        description: input.description,
        amount: input.amount,
        type: input.type,
        dueDate: dueDate,
        status: input.status,
        entityId: input.entityId ?? null,
        entityType: input.entityType ?? null,
        notes: input.notes ?? null,
        accountId: input.accountId ?? null,
        category: input.category ?? null,
        paymentMethod: input.paymentMethod ?? 'pix',
        tags: input.tags ?? [],
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const billRef = await adminDb.collection('bills').add(newBillData);
    
    // If the bill is created with 'paid' status, create a transaction immediately.
    if (input.status === 'paid' && input.accountId) {
        const transactionData: z.infer<typeof TransactionSchema> = {
            accountId: input.accountId,
            type: input.type === 'payable' ? 'expense' : 'income',
            amount: input.amount,
            description: `Pag/Rec: ${input.description}`,
            date: new Date(),
            category: input.category ?? (input.type === 'payable' ? 'Pagamento de contas' : 'Recebimento de contas'),
            status: 'paid',
            paymentMethod: input.paymentMethod ?? 'bank_transfer',
            customerId: input.entityType === 'customer' ? input.entityId : undefined,
            tags: [...(input.tags || []), `bill-${billRef.id}`],
        };
        await transactionService.createTransaction(transactionData, actorUid);
    }

    return { id: billRef.id };
};

export const listBills = async (actorUid: string): Promise<z.infer<typeof BillProfileSchema>[]> => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) return [];
    const { organizationId } = adminOrgData;
    
    const billsSnapshot = await adminDb.collection('bills')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('dueDate', 'desc')
                                     .orderBy('__name__', 'desc')
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
        
        const dueDate = data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : new Date().toISOString();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();

        const parsed = BillProfileSchema.safeParse({
            id: doc.id,
            ...data,
            dueDate: dueDate,
            createdAt: createdAt,
            entityName: entityName || undefined,
        });

        if (parsed.success) {
            return parsed.data;
        } else {
            console.error(`Failed to parse bill ${doc.id}:`, parsed.error);
            return null;
        }
    }).filter((b): b is z.infer<typeof BillProfileSchema> => b !== null);
    
    return bills;
};

export const updateBill = async (input: z.infer<typeof UpdateBillSchema>, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

    const { id, ...updateData } = input;
    const billRef = adminDb.collection('bills').doc(id);

    const doc = await billRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error("Conta não encontrada ou acesso negado.");
    }
    const oldData = doc.data()!;
    const oldStatus = oldData.status;

    // Sanitize the update payload
    const sanitizedUpdateData = {
        description: updateData.description,
        amount: updateData.amount,
        type: updateData.type,
        dueDate: new Date(updateData.dueDate),
        status: updateData.status,
        entityId: updateData.entityId ?? null,
        entityType: updateData.entityType ?? null,
        notes: updateData.notes ?? null,
        accountId: updateData.accountId ?? null,
        category: updateData.category ?? null,
        paymentMethod: updateData.paymentMethod ?? 'pix',
        tags: updateData.tags ?? [],
        updatedAt: FieldValue.serverTimestamp(),
    };


    await billRef.update(sanitizedUpdateData);

    // If the status is changing to 'paid' and it wasn't paid before, create a transaction.
    if (updateData.status === 'paid' && oldStatus !== 'paid') {
        const accountId = updateData.accountId || oldData.accountId;
        if (!accountId) {
             throw new Error("Uma conta financeira deve ser associada para marcar a pendência como paga.");
        }
        
        const transactionData: z.infer<typeof TransactionSchema> = {
            accountId: accountId,
            type: updateData.type === 'payable' ? 'expense' : 'income',
            amount: updateData.amount,
            description: `Pag/Rec: ${updateData.description}`,
            date: new Date(),
            category: updateData.category ?? (updateData.type === 'payable' ? 'Pagamento de contas' : 'Recebimento de contas'),
            status: 'paid',
            paymentMethod: updateData.paymentMethod ?? 'bank_transfer',
            customerId: updateData.entityType === 'customer' ? (updateData.entityId ?? undefined) : undefined,
            tags: [...(updateData.tags || []), `bill-${id}`],
        };
        await transactionService.createTransaction(transactionData, actorUid);
    }


    return { id };
};

export const deleteBill = async (billId: string, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

    const billRef = adminDb.collection('bills').doc(billId);
    const doc = await billRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error("Conta não encontrada ou acesso negado.");
    }
    
    if (doc.data()?.status === 'paid') {
        const transactionSnapshot = await adminDb.collection('transactions')
            .where('companyId', '==', organizationId)
            .where('tags', 'array-contains', `bill-${billId}`)
            .limit(1)
            .get();

        if (!transactionSnapshot.empty) {
            const transactionId = transactionSnapshot.docs[0].id;
            await transactionService.deleteTransaction(transactionId, actorUid);
        }
    }

    await billRef.delete();
    return { id: billId, success: true };
};

    

    
