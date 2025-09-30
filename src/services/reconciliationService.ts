
'use server';
/**
 * @fileOverview Service for managing bank reconciliations in Firestore.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ReconciliationSchema, ReconciliationProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createReconciliation = async (input: z.infer<typeof ReconciliationSchema> & { actor: string }) => {
    const { organizationId, adminUid } = await getAdminAndOrg(input.actor);

    const newReconciliationData = {
        companyId: organizationId,
        userId: adminUid,
        fileName: input.fileName,
        ofxContent: input.ofxContent,
        accountId: input.accountId,
        status: 'pending', // Always starts as pending
        createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('reconciliations').add(newReconciliationData);
    return { id: docRef.id };
};

export const getReconciliation = async (id: string, actor: string): Promise<z.infer<typeof ReconciliationProfileSchema> | null> => {
    const { organizationId } = await getAdminAndOrg(actor);
    const docRef = adminDb.collection('reconciliations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists || docSnap.data()?.companyId !== organizationId) {
        return null;
    }

    const data = docSnap.data()!;
     if (!data.accountId) {
        console.warn(`Reconciliation doc ${id} is missing accountId.`);
        return null; // Don't return records without an accountId
    }
    return ReconciliationProfileSchema.parse({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
    });
};

export const listReconciliations = async (actor: string): Promise<z.infer<typeof ReconciliationProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actor);

    const snapshot = await adminDb.collection('reconciliations')
        .where('companyId', '==', organizationId)
        .orderBy('createdAt', 'desc')
        .orderBy('__name__', 'desc')
        .get();

    if (snapshot.empty) {
        return [];
    }

    const reconciliations = snapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.accountId) {
            console.warn(`Skipping reconciliation doc ${doc.id} - missing accountId.`);
            return null;
        }
        return ReconciliationProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        });
    }).filter((rec): rec is z.infer<typeof ReconciliationProfileSchema> => rec !== null);
    
    return reconciliations;
};

export const updateReconciliation = async (input: {id: string, actor: string, fileName?: string, status?: 'reconciled' | 'pending'}) => {
    const { organizationId } = await getAdminAndOrg(input.actor);
    const docRef = adminDb.collection('reconciliations').doc(input.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists || docSnap.data()?.companyId !== organizationId) {
        throw new Error('Conciliação não encontrada ou acesso negado.');
    }
    
    const updateData: { [key: string]: any } = {};
    if (input.fileName) {
        updateData.fileName = input.fileName;
    }
    if(input.status) {
        updateData.status = input.status;
    }

    if (Object.keys(updateData).length > 0) {
        await docRef.update(updateData);
    }
    
    return { id: input.id };
};

export const deleteReconciliation = async (id: string, actor: string) => {
    const { organizationId } = await getAdminAndOrg(actor);
    const docRef = adminDb.collection('reconciliations').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists || docSnap.data()?.companyId !== organizationId) {
        throw new Error('Conciliação não encontrada ou acesso negado.');
    }

    await docRef.delete();
    return { id, success: true };
};
