
'use server';
/**
 * @fileOverview Service for managing QoroPulse conversations in Firestore.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ConversationSchema, ConversationProfileSchema, PulseMessage } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps in nested objects to ISO strings
const convertTimestampsToISO = (obj: any): any => {
    if (!obj) return obj;
    if (obj instanceof Timestamp) {
        return obj.toDate().toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestampsToISO);
    }
    if (typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            newObj[key] = convertTimestampsToISO(obj[key]);
        }
        return newObj;
    }
    return obj;
};


export const createConversation = async (actorUid: string, title: string, messages: PulseMessage[]) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newConversationData: z.infer<typeof ConversationSchema> = {
        userId: actorUid,
        organizationId,
        title,
        messages,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('pulse_conversations').add(newConversationData);
    return { id: docRef.id };
};

export const updateConversation = async (actorUid: string, conversationId: string, messages: PulseMessage[]) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actorUid) {
        throw new Error("Conversa não encontrada ou acesso negado.");
    }

    await conversationRef.update({
        messages,
        updatedAt: FieldValue.serverTimestamp(),
    });
};

export const getConversation = async ({ conversationId, actor }: { conversationId: string, actor: string }) => {
    const { organizationId } = await getAdminAndOrg(actor);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actor) {
        throw new Error("Conversa não encontrada ou acesso negado.");
    }
    
    const data = doc.data();
    // Sanitize data for client components by converting Timestamps
    const sanitizedData = convertTimestampsToISO(data);
    
    return sanitizedData as z.infer<typeof ConversationSchema>;
};


export const listConversations = async ({ actor }: { actor: string }): Promise<z.infer<typeof ConversationProfileSchema>[]> => {
    try {
        const { organizationId } = await getAdminAndOrg(actor);
        // Correctly order by 'updatedAt' in descending order directly in the query
        const snapshot = await adminDb.collection('pulse_conversations')
            .where('organizationId', '==', organizationId)
            .where('userId', '==', actor)
            .orderBy('updatedAt', 'desc') 
            .limit(50)
            .get();

        if (snapshot.empty) {
            return [];
        }
        
        const conversations = snapshot.docs.map(doc => {
            const data = doc.data();
            const sanitizedData = convertTimestampsToISO(data);
            return ConversationProfileSchema.parse({
                id: doc.id,
                ...sanitizedData,
            });
        });
        
        return conversations;
    } catch (error: any) {
        console.error("Error listing conversations in service:", error);
        if (error.code === 'FAILED_PRECONDITION') {
            throw new Error('A consulta do histórico de conversas requer um índice. Verifique a configuração do Firestore Indexes.');
        }
        throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
};
