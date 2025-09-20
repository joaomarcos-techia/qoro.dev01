
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
  ConversationProfileSchema,
  PulseMessageSchema,
} from '@/ai/schemas';

const COLLECTION = 'pulse_conversations';

/**
 * Converts a Firestore Timestamp or other date representation to a safe ISO string.
 */
function toISOStringSafe(date: any): string {
    if (!date) return new Date().toISOString();
    if (date instanceof Timestamp) return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') {
        try {
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) return parsed.toISOString();
        } catch (e) {
            console.error('Invalid date string for conversion:', date, e);
        }
    }
    return new Date().toISOString();
}

/**
 * Sanitizes messages to ensure they are valid and dates are strings.
 */
function sanitizeMessages(messages?: any[]): PulseMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => PulseMessageSchema.parse({ 
        role: m.role || 'user', 
        content: m.content.trim() 
    }));
}

/**
 * Creates a new conversation in Firestore.
 */
export async function createConversation(input: {
  actor: string;
  messages: PulseMessage[];
  title: string;
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
    title: title,
    messages: safeMessages, // Already sanitized
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
    updatedAt: toISOStringSafe(data.updatedAt),
  };
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
          updatedAt: toISOStringSafe(data.updatedAt)
      });
      if (profile.success) {
          profiles.push(profile.data);
      } else {
          console.warn(`Invalid conversation profile found in DB for user ${actor}: ${doc.id}`);
      }
  });

  return profiles;
}
