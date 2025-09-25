
'use server';
/**
 * @fileOverview Service for managing qualification leads in Firestore.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { QualificationLeadSchema } from '@/ai/schemas';
import { adminDb } from '@/lib/firebase-admin';

export const createQualificationLead = async (input: z.infer<typeof QualificationLeadSchema>) => {
    const newLeadData = {
        ...input,
        createdAt: FieldValue.serverTimestamp(),
        status: 'new', // Add a default status
    };

    const leadRef = await adminDb.collection('qualification_leads').add(newLeadData);
    return { id: leadRef.id };
};
