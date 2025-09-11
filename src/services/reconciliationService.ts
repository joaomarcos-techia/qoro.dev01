
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
        companyId: organizationId, // Use companyId to match other services
        userId: adminUid,
        fileName: input.fileName,
        ofxContent: input.ofxContent,
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
        .orderBy('__name__', 'desc') // Added for query stability
        .get();

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return ReconciliationProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        });
    });
};
