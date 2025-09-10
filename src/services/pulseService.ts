
'use server';
/**
 * @fileOverview Service for managing QoroPulse conversations in Firestore.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ConversationSchema, ConversationProfileSchema, PulseMessage, Conversation } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps in nested objects to ISO strings for client compatibility
const convertTimestampsToISO = (obj: any): any => {
    if (!obj) return obj;
    if (obj instanceof Timestamp) {
        return obj.toDate().toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestampsToISO);
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            newObj[key] = convertTimestampsToISO(obj[key]);
        }
        return newObj;
    }
    return obj;
};

// Converts various message formats to a consistent PulseMessage format.
const normalizeDbMessagesToPulseMessages = (messages: any[]): PulseMessage[] => {
    if (!messages || !Array.isArray(messages)) return [];
    
    return messages
        .map((msg: any): PulseMessage | null => {
            if (!msg || !msg.role) return null;

            const role = msg.role === 'model' ? 'assistant' : msg.role;
            if (role !== 'user' && role !== 'assistant') return null;
            
            // Handle both `content` and `parts` format from DB
            let content = '';
            if(typeof msg.content === 'string') {
                content = msg.content;
            } else if (Array.isArray(msg.parts) && msg.parts[0] && typeof msg.parts[0].text === 'string') {
                content = msg.parts[0].text;
            }

            return { role, content };
        })
        .filter((msg): msg is PulseMessage => msg !== null && typeof msg.content === 'string');
};


export const createConversation = async ({ actor, messages, title }: { actor: string; messages: PulseMessage[]; title?: string; }): Promise<{ id: string, title: string }> => {
    const { organizationId } = await getAdminAndOrg(actor);
    const newDocRef = adminDb.collection('pulse_conversations').doc();

    const newConversationData = {
        userId: actor,
        organizationId,
        title: title || 'Nova Conversa',
        messages, 
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    await newDocRef.set(newConversationData);
    return { id: newDocRef.id, title: newConversationData.title };
};

export const updateConversation = async (actorUid: string, conversationId: string, updatedConversation: Partial<Omit<Conversation, 'id'>>): Promise<void> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actorUid) {
        throw new Error("Conversa não encontrada ou acesso negado.");
    }
    
    const updateData: any = {
        updatedAt: FieldValue.serverTimestamp(),
    };

    if(updatedConversation.messages) {
        updateData.messages = updatedConversation.messages.map(m => ({
            role: m.role,
            content: m.content
        }))
    }
    if(updatedConversation.title) {
        updateData.title = updatedConversation.title;
    }

    await conversationRef.update(updateData);
};

export const getConversation = async ({ conversationId, actor }: { conversationId: string, actor: string }): Promise<Conversation | null> => {
    const { organizationId } = await getAdminAndOrg(actor);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actor) {
        return null;
    }
    
    const data = doc.data();
    if (!data) return null;
    
    const clientMessages = normalizeDbMessagesToPulseMessages(data.messages || []);

    const parsedData = ConversationSchema.parse({
        id: doc.id,
        title: data.title,
        messages: clientMessages,
    })
    
    return parsedData;
};

export const listConversations = async ({ actor }: { actor: string }): Promise<z.infer<typeof ConversationProfileSchema>[]> => {
    try {
        const { organizationId } = await getAdminAndOrg(actor);
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

export const deleteConversation = async ({ conversationId, actor }: { conversationId: string, actor: string }): Promise<{ success: boolean }> => {
    const { organizationId } = await getAdminAndOrg(actor);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actor) {
        throw new Error("Conversa não encontrada ou acesso negado.");
    }

    await conversationRef.delete();
    return { success: true };
};
