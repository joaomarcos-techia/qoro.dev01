'use server';
/**
 * @fileOverview Service layer for QoroPulse conversations, using Firebase Admin SDK.
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  PulseMessage,
  Conversation as ConversationProfile,
  ConversationProfileSchema,
} from '@/ai/schemas';

const FirestoreMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().default(''),
});

const FirestoreConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  userId: z.string(),
  messages: z.array(FirestoreMessageSchema),
  createdAt: z.any(),
  updatedAt: z.any(),
});
export type FirestoreConversation = z.infer<typeof FirestoreConversationSchema>;


const COLLECTION = 'pulse_conversations';

/**
 * 🔹 Sanitize messages to ensure Firestore compatibility
 */
function sanitizeMessages(messages?: PulseMessage[]): z.infer<typeof FirestoreMessageSchema>[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: m.role || 'user',
    content: m.content || '',
  }));
}

/**
 * 🔹 Create new conversation
 */
export async function createConversation(input: {
  actor: string;
  messages: PulseMessage[];
  title?: string;
}): Promise<ConversationProfile> {
  const safeMessages = sanitizeMessages(input.messages);

  const docRef = adminDb.collection(COLLECTION).doc();

  const convData = {
    userId: input.actor,
    title: input.title?.trim() || safeMessages[0]?.content?.slice(0, 30) || 'Nova conversa',
    messages: safeMessages,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(convData);
  
  return {
      id: docRef.id,
      title: convData.title,
      messages: convData.messages,
      updatedAt: new Date().toISOString(), // Approximate for immediate return
  };
}

/**
 * 🔹 Load existing conversation
 */
export async function getConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<ConversationProfile | null> {
  const conversationRef = adminDb.collection(COLLECTION).doc(input.conversationId);
  const snap = await conversationRef.get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (data?.userId !== input.actor) return null; // Security check

  return {
    id: snap.id,
    title: data.title,
    messages: data.messages,
    updatedAt: data.updatedAt.toDate().toISOString()
  };
}

/**
 * 🔹 Update existing conversation
 */
export async function updateConversation(
  actor: string,
  conversationId: string,
  update: { messages?: PulseMessage[]; title?: string }
): Promise<void> {
    const docRef = adminDb.collection(COLLECTION).doc(conversationId);
    
    const currentDoc = await docRef.get();
    if (!currentDoc.exists || currentDoc.data()?.userId !== actor) {
        throw new Error("Conversation not found or access denied.");
    }
    
    const payload: any = {
        updatedAt: FieldValue.serverTimestamp(),
    };
    if (update.title) {
        payload.title = update.title;
    }
    if (update.messages) {
        payload.messages = sanitizeMessages(update.messages);
    }
    
    await docRef.update(payload);
}

/**
 * 🔹 Delete a conversation
 */
export async function deleteConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<{ success: boolean }> {
  const conversationRef = adminDb.collection(COLLECTION).doc(input.conversationId);
  
  const currentDoc = await conversationRef.get();
   if (!currentDoc.exists || currentDoc.data()?.userId !== input.actor) {
        return { success: false };
    }

  await conversationRef.delete();
  return { success: true };
}

/**
 * 🔹 List all conversations for an actor
 */
export async function listConversations(input: { actor: string }): Promise<z.infer<typeof ConversationProfileSchema>[]> {
    const q = adminDb.collection(COLLECTION)
        .where("userId", "==", input.actor)
        .orderBy("updatedAt", "desc");

    const snap = await q.get();

    if (snap.empty) {
        return [];
    }

    const list: z.infer<typeof ConversationProfileSchema>[] = [];
    snap.forEach((doc) => {
        const data = doc.data();
        const parsed = ConversationProfileSchema.safeParse({ 
            id: doc.id, 
            title: data.title,
            updatedAt: data.updatedAt?.toDate().toISOString()
        });
        if (parsed.success) {
            list.push(parsed.data);
        } else {
            console.warn("Found invalid conversation in DB:", parsed.error);
        }
    });

    return list;
}
