'use server';
/**
 * @fileOverview Service layer for QoroPulse conversations, using Firebase Admin SDK.
 * This version has been refactored for simplicity, robustness, and correctness.
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  PulseMessage,
  Conversation,
  ConversationProfile,
  ConversationProfileSchema
} from '@/ai/schemas';

const COLLECTION = 'pulse_conversations';

/**
 * Sanitizes messages to ensure compatibility with Firestore.
 * Removes invalid/empty messages and ensures content is a string.
 */
function sanitizeMessages(messages?: PulseMessage[]): PulseMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => ({ role: m.role, content: m.content.trim() }));
}

/**
 * Creates a new conversation in Firestore.
 */
export async function createConversation(input: {
  actor: string;
  messages: PulseMessage[];
  title?: string;
}): Promise<Conversation> {
  const { actor, messages, title } = input;
  if (!actor || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Actor and at least one message are required.');
  }

  const safeMessages = sanitizeMessages(messages);
  if (safeMessages.length === 0) {
    throw new Error('No valid messages provided.');
  }

  const docRef = adminDb.collection(COLLECTION).doc();
  const convData = {
    userId: actor,
    title: title || safeMessages[0].content.substring(0, 40) || 'Nova Conversa',
    messages: safeMessages,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(convData);

  return {
    id: docRef.id,
    title: convData.title,
    messages: safeMessages,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves a specific conversation for a user.
 */
export async function getConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<Conversation | null> {
  const { conversationId, actor } = input;
  const docRef = adminDb.collection(COLLECTION).doc(conversationId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.warn(`Conversation not found: ${conversationId}`);
    return null;
  }

  const data = docSnap.data();
  if (data?.userId !== actor) {
    console.error(`Unauthorized access attempt by ${actor} on conversation ${conversationId}`);
    return null; // Security: Do not leak existence of conversation
  }

  return {
    id: docSnap.id,
    title: data.title,
    messages: sanitizeMessages(data.messages),
    updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
  };
}

/**
 * Updates an existing conversation with new messages or a new title.
 */
export async function updateConversation(
  actor: string,
  conversationId: string,
  update: { messages?: PulseMessage[]; title?: string }
): Promise<void> {
  const docRef = adminDb.collection(COLLECTION).doc(conversationId);

  // Security check: ensure user owns the conversation before updating
  const currentDoc = await docRef.get();
  if (!currentDoc.exists || currentDoc.data()?.userId !== actor) {
    throw new Error('Conversation not found or access denied.');
  }

  const payload: { [key: string]: any } = {
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
 * Deletes a conversation for a user.
 */
export async function deleteConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<{ success: boolean }> {
  const { conversationId, actor } = input;
  const docRef = adminDb.collection(COLLECTION).doc(conversationId);

  // Security check before deleting
  const currentDoc = await docRef.get();
  if (currentDoc.exists && currentDoc.data()?.userId === actor) {
    await docRef.delete();
    return { success: true };
  }
  
  if (!currentDoc.exists) {
      console.warn(`Attempted to delete non-existent conversation: ${conversationId}`);
  } else {
      console.error(`Unauthorized delete attempt by ${actor} on conversation ${conversationId}`);
  }
  
  return { success: false }; // Fail silently for security reasons
}

/**
 * Lists all conversation profiles for a given user, ordered by most recent.
 */
export async function listConversations(input: {
  actor: string;
  limit?: number;
}): Promise<ConversationProfile[]> {
  const { actor, limit = 50 } = input;
  const query = adminDb.collection(COLLECTION)
    .where("userId", "==", actor)
    .orderBy("updatedAt", "desc")
    .limit(limit);

  const snapshot = await query.get();
  if (snapshot.empty) {
    return [];
  }

  const profiles: ConversationProfile[] = [];
  snapshot.forEach(doc => {
      const data = doc.data();
      const profile = ConversationProfileSchema.safeParse({
          id: doc.id,
          title: data.title,
          updatedAt: (data.updatedAt as Timestamp).toDate().toISOString()
      });
      if (profile.success) {
          profiles.push(profile.data);
      } else {
          console.warn(`Invalid conversation profile found in DB for user ${actor}: ${doc.id}`);
      }
  });

  return profiles;
}
