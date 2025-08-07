
'use server';
/**
 * @fileOverview Service for managing QoroPulse conversations in Firestore.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAndOrg } from './utils';
import { PulseMessageSchema, ConversationSchema } from '@/ai/schemas';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';


export const saveConversation = async (
    actorUid: string, 
    title: string, 
    messages: z.infer<typeof PulseMessageSchema>[]
): Promise<string> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const conversationData = {
        userId: actorUid,
        organizationId,
        title,
        messages,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const conversationRef = await adminDb.collection('pulse_conversations').add(conversationData);
    return conversationRef.id;
}

export const updateConversation = async (
    conversationId: string, 
    actorUid: string, 
    messages: z.infer<typeof PulseMessageSchema>[]
): Promise<void> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId) {
        throw new Error("Conversation not found or access denied.");
    }

    await conversationRef.update({
        messages,
        updatedAt: FieldValue.serverTimestamp(),
    });
}

export const listConversations = async (actorUid: string): Promise<z.infer<typeof ConversationSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const snapshot = await adminDb.collection('pulse_conversations')
        .where('organizationId', '==', organizationId)
        .where('userId', '==', actorUid)
        .orderBy('updatedAt', 'desc')
        .get();
        
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return ConversationSchema.parse({
            id: doc.id,
            title: data.title,
            createdAt: data.createdAt.toDate().toISOString(),
            // Ensure messages is always an array, even if missing in Firestore
            messages: data.messages || [],
        });
    });
};

export const getConversation = async (conversationId: string, actorUid: string): Promise<z.infer<typeof ConversationSchema> | null> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const docRef = adminDb.collection('pulse_conversations').doc(conversationId);
    
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actorUid) {
        return null; // Return null instead of throwing error for "not found" cases
    }

    const data = doc.data()!;
    return ConversationSchema.parse({
        id: doc.id,
        title: data.title,
        createdAt: data.createdAt.toDate().toISOString(),
        messages: data.messages || [],
    });
};


export const deleteConversation = async (conversationId: string, actorUid: string): Promise<void> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const docRef = adminDb.collection('pulse_conversations').doc(conversationId);
    
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actorUid) {
        throw new Error("Conversation not found or permission denied.");
    }

    await docRef.delete();
}
