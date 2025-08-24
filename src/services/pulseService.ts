
'use server';
/**
 * @fileOverview Service for managing QoroPulse conversations in Firestore.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ConversationSchema, ConversationProfileSchema, PulseMessage } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

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
    
    const data = doc.data() as z.infer<typeof ConversationSchema>;
    return data;
};


export const listConversations = async ({ actor }: { actor: string }): Promise<z.infer<typeof ConversationProfileSchema>[]> => {
    try {
        const { organizationId } = await getAdminAndOrg(actor);
        // Query simplified to avoid requiring a composite index. Sorting is handled client-side.
        const snapshot = await adminDb.collection('pulse_conversations')
            .where('organizationId', '==', organizationId)
            .where('userId', '==', actor)
            .limit(50)
            .get();

        if (snapshot.empty) {
            return [];
        }
        
        const conversations = snapshot.docs.map(doc => {
            const data = doc.data();
            return ConversationProfileSchema.parse({
                id: doc.id,
                title: data.title || 'Conversa sem título',
                updatedAt: data.updatedAt.toDate().toISOString(),
            });
        });
        
        // Sort conversations by date in the backend code
        conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return conversations;
    } catch (error: any) {
        console.error("Error listing conversations in service:", error);
        // Re-throw the error to be handled by the calling component
        throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
};
