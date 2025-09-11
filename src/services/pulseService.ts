
'use server';
/**
 * @fileOverview Service layer for QoroPulse conversations.
 * Handles Firestore persistence with strict sanitization.
 */

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
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
  organizationId: z.string(),
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

  const docRef = doc(collection(db, COLLECTION));

  const convData = {
    userId: input.actor,
    organizationId: 'temp_org_id', // This should be retrieved from user claims or another service
    title: input.title?.trim() || safeMessages[0]?.content?.slice(0, 30) || 'Nova conversa',
    messages: safeMessages,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(docRef, convData);
  
  return {
      id: docRef.id,
      ...convData,
      updatedAt: convData.updatedAt.toDate().toISOString(),
  };
}

/**
 * 🔹 Load existing conversation
 */
export async function getConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<ConversationProfile | null> {
  const conversationRef = doc(db, COLLECTION, input.conversationId);
  const snap = await getDoc(conversationRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  if (data.userId !== input.actor) return null; // Security check

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
    const docRef = doc(db, COLLECTION, conversationId);
    
    // Security check: ensure user is allowed to update
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists() || currentDoc.data().userId !== actor) {
        throw new Error("Conversation not found or access denied.");
    }
    
    const payload: any = {
        updatedAt: Timestamp.now(),
    };
    if (update.title) {
        payload.title = update.title;
    }
    if (update.messages) {
        payload.messages = sanitizeMessages(update.messages);
    }
    
    await updateDoc(docRef, payload);
}

/**
 * 🔹 Delete a conversation
 */
export async function deleteConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<{ success: boolean }> {
  const conversationRef = doc(db, COLLECTION, input.conversationId);
  
  const currentDoc = await getDoc(conversationRef);
   if (!currentDoc.exists() || currentDoc.data().userId !== input.actor) {
        return { success: false };
    }

  await deleteDoc(conversationRef);
  return { success: true };
}

/**
 * 🔹 List all conversations for an actor
 */
export async function listConversations(input: { actor: string }): Promise<z.infer<typeof ConversationProfileSchema>[]> {
    const q = query(
        collection(db, COLLECTION), 
        where("userId", "==", input.actor),
        orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);

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
