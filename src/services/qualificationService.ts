'use server';
/**
 * @fileOverview Service for managing qualification leads in Firestore.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

// O serviço agora espera um objeto genérico, já que a formatação é feita no fluxo.
export const createQualificationLead = async (input: Record<string, any>) => {
    const newLeadData = {
        ...input,
        createdAt: FieldValue.serverTimestamp(),
        status: 'new', // Add a default status
    };

    const leadRef = await adminDb.collection('qualification_leads').add(newLeadData);
    return { id: leadRef.id };
};
