
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
    const { companyId, adminUid } = await getAdminAndOrg(input.actor);

    const newReconciliationData = {
        companyId: companyId,
        userId: adminUid,
        fileName: input.fileName,
        ofxContent: input.ofxContent,
        accountId: input.accountId,
        createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('reconciliations').add(newReconciliationData);
    return { id: docRef.id };
};

export const getReconciliation = async (id: string, actor: string): Promise<z.infer<typeof ReconciliationProfileSchema> | null> => {
    const { companyId } = await getAdminAndOrg(actor);
    const docRef = adminDb.collection('reconciliations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists || docSnap.data()?.companyId !== companyId) {
        return null;
    }

    const data = docSnap.data()!;
    return ReconciliationProfileSchema.parse({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
    });
};

export const listReconciliations = async (actor: string): Promise<z.infer<typeof ReconciliationProfileSchema>[]> => {
    const { companyId } = await getAdminAndOrg(actor);

    const snapshot = await adminDb.collection('reconciliations')
        .where('companyId', '==', companyId)
        .orderBy('createdAt', 'desc')
        .orderBy('__name__', 'desc')
        .get();

    if (snapshot.empty) {
        return [];
    }

    const reconciliations = snapshot.docs.map(doc => {
        const data = doc.data();
        return ReconciliationProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        });
    });
    
    return reconciliations;
};

export const updateReconciliation = async (id: string, fileName: string, actor: string) => {
    const { companyId } = await getAdminAndOrg(actor);
    const docRef = adminDb.collection('reconciliations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists || docSnap.data()?.companyId !== companyId) {
        throw new Error('Conciliação não encontrada ou acesso negado.');
    }
    
    await docRef.update({ fileName });
    return { id };
};

export const deleteReconciliation = async (id: string, actor: string) => {
    const { companyId } = await getAdminAndOrg(actor);
    const docRef = adminDb.collection('reconciliations').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists || docSnap.data()?.companyId !== companyId) {
        throw new Error('Conciliação não encontrada ou acesso negado.');
    }

    await docRef.delete();
    return { id, success: true };
};
