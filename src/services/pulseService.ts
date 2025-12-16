
'use server';
/**
 * @fileOverview Service layer for QoroPulse conversations, using Firebase Admin SDK.
 * This version has been refactored for simplicity, robustness, and correctness.
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  Conversation,
  ConversationProfile,
  ConversationProfileSchema,
  PulseMessage,
  PulseMessageSchema,
} from '@/ai/schemas';

const COLLECTION = 'pulse_conversations';

/**
 * Converts a Firestore Timestamp or other date representation to a safe ISO string.
 * Returns the current ISO string as a fallback for invalid inputs.
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
            // Fallthrough to fallback for invalid date strings
        }
    }
    // Fallback for unexpected types or invalid strings
    return new Date().toISOString();
}


/**
 * Sanitizes messages to ensure they are valid and dates are strings.
 */
function sanitizeMessages(messages?: any[]): PulseMessage[] {
  if (!Array.isArray(messages)) return [];
  
  const validRoles = new Set(['user', 'assistant', 'tool', 'model']);

  return messages
    .map(m => {
        if (!m || typeof m.content !== 'string' || m.content.trim().length === 0) {
            return null; // Filter out invalid messages
        }
        const role = validRoles.has(m.role) ? m.role : 'user'; // Default to 'user' if role is invalid
        return { role, content: m.content.trim() };
    })
    .filter((m): m is PulseMessage => m !== null)
    .map(m => PulseMessageSchema.parse(m));
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
    return null;
  }

  const data = docSnap.data();
  if (data?.userId !== actor) {
    // Security: Do not leak existence of conversation
    return null; 
  }

  return {
    id: docSnap.id,
    title: data.title || 'Conversa',
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
  
  // Fail silently for security reasons if doc doesn't exist or user is not owner
  return { success: false };
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
      // Safe parsing with Zod to prevent crashes on schema mismatches
      const profile = ConversationProfileSchema.safeParse({
          id: doc.id,
          title: data.title || 'Conversa', // Provide a fallback title
          updatedAt: toISOStringSafe(data.updatedAt)
      });
      if (profile.success) {
          profiles.push(profile.data);
      }
  });

  return profiles;
}
