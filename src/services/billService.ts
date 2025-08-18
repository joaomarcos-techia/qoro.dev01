
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { BillSchema, BillProfile, UpdateBillSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createBill = async (input: z.infer<typeof BillSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newBillData = {
        ...input,
        dueDate: new Date(input.dueDate),
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const billRef = await adminDb.collection('bills').add(newBillData);
    return { id: billRef.id };
};

export const listBills = async (actorUid: string): Promise<BillProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const billsSnapshot = await adminDb.collection('bills')
        .where('companyId', '==', organizationId)
        .orderBy('createdAt', 'desc')
        .get();

    if (billsSnapshot.empty) return [];
    
    const customerIds = [...new Set(billsSnapshot.docs.map(doc => doc.data().contactId).filter(id => id))];
    const contacts: Record<string, { name?: string }> = {};

    if (customerIds.length > 0) {
        const customersSnapshot = await adminDb.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => { contacts[doc.id] = { name: doc.data().name }; });

        const suppliersSnapshot = await adminDb.collection('suppliers').where('__name__', 'in', customerIds).get();
        suppliersSnapshot.forEach(doc => { contacts[doc.id] = { name: doc.data().name }; });
    }


    const bills: BillProfile[] = billsSnapshot.docs.map(doc => {
        const data = doc.data();
        return BillProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            dueDate: data.dueDate.toDate(),
            paymentDate: data.paymentDate ? data.paymentDate.toDate() : null,
            contactName: data.contactId ? contacts[data.contactId]?.name : undefined,
        });
    });

    return bills;
};

export const updateBill = async (input: z.infer<typeof UpdateBillSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const { id, ...updateData } = input;
    const billRef = adminDb.collection('bills').doc(id);

    const doc = await billRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error('Conta não encontrada ou acesso negado.');
    }

    await billRef.update({
        ...updateData,
        dueDate: new Date(updateData.dueDate),
        paymentDate: updateData.paymentDate ? new Date(updateData.paymentDate) : null,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id };
};

export const deleteBill = async (billId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const billRef = adminDb.collection('bills').doc(billId);

    const doc = await billRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error('Conta não encontrada ou acesso negado.');
    }

    await billRef.delete();
    return { id: billId, success: true };
};
