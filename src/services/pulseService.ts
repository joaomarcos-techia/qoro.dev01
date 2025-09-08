
'use server';
/**
 * @fileOverview Service for managing QoroPulse conversations in Firestore.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ConversationSchema, ConversationProfileSchema, PulseMessage, Conversation } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';
import { MessageData } from 'genkit';


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


export const createConversation = async (actorUid: string, title: string, messages: MessageData[]): Promise<{ id: string }> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newConversationData = {
        userId: actorUid,
        organizationId,
        title: title || 'Nova Conversa',
        messages,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('pulse_conversations').add(newConversationData);
    return { id: docRef.id };
};

export const updateConversation = async (actorUid: string, conversationId: string, updatedConversation: Partial<Omit<Conversation, 'id'>>): Promise<void> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actorUid) {
        throw new Error("Conversa não encontrada ou acesso negado.");
    }
    
    const updateData = {
        ...updatedConversation,
        updatedAt: FieldValue.serverTimestamp(),
    }

    await conversationRef.update(updateData);
};

export const getConversation = async ({ conversationId, actor }: { conversationId: string, actor: string }): Promise<Conversation | null> => {
    const { organizationId } = await getAdminAndOrg(actor);
    const conversationRef = adminDb.collection('pulse_conversations').doc(conversationId);

    const doc = await conversationRef.get();
    if (!doc.exists || doc.data()?.organizationId !== organizationId || doc.data()?.userId !== actor) {
        return null; // Return null instead of throwing an error for not found cases
    }
    
    const data = doc.data();
    if (!data) return null;

    // Sanitize data for client components by converting Timestamps
    const sanitizedData = convertTimestampsToISO(data);

    // Convert Genkit's MessageData[] (with 'parts') to PulseMessage[] (with 'content')
    const clientMessages: PulseMessage[] = (sanitizedData.messages || [])
        .map((msg: MessageData) => {
            let content = '';
            if (msg.parts && msg.parts.length > 0) {
                // Find the first text part and use it as content
                const textPart = msg.parts.find(part => part.text);
                if (textPart) {
                    content = textPart.text!;
                }
            } else if ((msg as any).content) {
                // Fallback for already converted messages
                content = (msg as any).content;
            }

            // Map Genkit roles to frontend roles (model -> assistant)
            const role = msg.role === 'model' ? 'assistant' : 'user';
            
            return { role, content };
        })
        .filter((msg): msg is PulseMessage => !!msg.content); // Filter out any empty messages


    const parsedData = ConversationSchema.parse({
        id: doc.id,
        title: sanitizedData.title,
        messages: clientMessages, // Use the converted messages
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
