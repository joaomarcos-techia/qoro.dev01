
'use server';
/**
 * @fileOverview Service layer for QoroPulse conversations.
 * Handles Firestore persistence with strict sanitization.
 */

import { db } from '@/lib/firebase'; // Firestore client inicializado com ignoreUndefinedProperties
import { z } from 'zod';
import {
  AskPulseInputSchema,
  AskPulseOutputSchema,
  PulseMessage,
} from '@/ai/schemas';

const ConversationSchema = z.object({
  id: z.string(),
  actor: z.string(),
  title: z.string().default('Nova conversa'),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().default(''),
    })
  ),
});
export type Conversation = z.infer<typeof ConversationSchema>;

const COLLECTION = 'pulseConversations';

/**
 * 🔹 Sanitize messages to ensure Firestore compatibility
 */
function sanitizeMessages(messages: PulseMessage[]): PulseMessage[] {
  return (messages || []).map((m) => ({
    role: m.role,
    content: m.content ?? '',
  }));
}

/**
 * 🔹 Create new conversation
 */
export async function createConversation(input: {
  actor: string;
  messages: PulseMessage[];
  title?: string;
}): Promise<Conversation> {
  const safeMessages = sanitizeMessages(input.messages);

  const conv: Conversation = {
    id: crypto.randomUUID(),
    actor: input.actor,
    title: input.title?.trim() || safeMessages[0]?.content?.slice(0, 30) || 'Nova conversa',
    messages: safeMessages,
  };

  await db.collection(COLLECTION).doc(conv.id).set(conv, { merge: true });
  return conv;
}

/**
 * 🔹 Load existing conversation
 */
export async function getConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<Conversation | null> {
  const snap = await db.collection(COLLECTION).doc(input.conversationId).get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data) return null;
  if (data.actor !== input.actor) return null; // segurança: cada ator só vê suas conversas

  const parsed = ConversationSchema.safeParse({ id: snap.id, ...data });
  return parsed.success ? parsed.data : null;
}

/**
 * 🔹 Update existing conversation
 */
export async function updateConversation(
  actor: string,
  conversationId: string,
  update: { messages?: PulseMessage[]; title?: string }
): Promise<void> {
  const safeMessages = sanitizeMessages(update.messages || []);

  const payload: Partial<Conversation> = {
    ...(update.title ? { title: update.title } : {}),
    ...(safeMessages.length > 0 ? { messages: safeMessages } : {}),
  };

  if (Object.keys(payload).length === 0) return; // nada para salvar

  await db.collection(COLLECTION).doc(conversationId).update(payload);
}

/**
 * 🔹 Delete a conversation
 */
export async function deleteConversation(input: {
  conversationId: string;
  actor: string;
}): Promise<{ success: boolean }> {
  const conv = await getConversation(input);
  if (!conv) return { success: false };

  await db.collection(COLLECTION).doc(input.conversationId).delete();
  return { success: true };
}

/**
 * 🔹 List all conversations for an actor
 */
export async function listConversations(actor: string): Promise<Conversation[]> {
  const snap = await db.collection(COLLECTION).where('actor', '==', actor).get();
  const list: Conversation[] = [];
  snap.forEach((doc) => {
    const data = doc.data();
    const parsed = ConversationSchema.safeParse({ id: doc.id, ...data });
    if (parsed.success) list.push(parsed.data);
  });
  return list.sort((a, b) => (a.title < b.title ? -1 : 1));
}
