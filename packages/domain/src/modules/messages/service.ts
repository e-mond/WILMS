import { and, desc, eq, or } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { USER_ROLE } from '@wilms/shared-rbac';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { messageThreads, messages } from '../../db/schema/messages.js';
import * as userRepo from '../../repositories/user.repository.js';
import {
  getOrCreateThreadInMemory,
  getThreadInMemory,
  isMemoryMessagingEnabled,
  listThreadsInMemory,
  sendMessageInMemory,
} from './memory-store.js';
import { createInAppNotification } from '../../infrastructure/notifications/in-app-notify.js';
import { sendPushToUser } from '../notifications/push.service.js';

export interface MessageDto {
  id: string;
  threadId: string;
  senderUserId: string;
  senderDisplayName: string;
  body: string;
  sentAt: string;
}

export interface MessageThreadSummary {
  id: string;
  adminUserId: string;
  adminDisplayName: string;
  collectorUserId: string;
  collectorDisplayName: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageThreadDetail extends MessageThreadSummary {
  messages: MessageDto[];
}

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    return;
  }
}

async function assertThreadParticipant(threadId: string, userId: string) {
  const db = getDb();
  const [thread] = await db
    .select()
    .from(messageThreads)
    .where(eq(messageThreads.id, threadId))
    .limit(1);

  if (!thread) {
    throw new Error('NOT_FOUND');
  }

  if (thread.adminUserId !== userId && thread.collectorUserId !== userId) {
    throw new Error('UNAUTHORIZED');
  }

  return thread;
}

async function resolveDisplayName(userId: string): Promise<string> {
  const user = await userRepo.getUserById(userId);
  return user?.displayName ?? 'User';
}

async function mapThreadSummary(
  thread: typeof messageThreads.$inferSelect,
  lastMessage?: typeof messages.$inferSelect,
): Promise<MessageThreadSummary> {
  const [adminDisplayName, collectorDisplayName] = await Promise.all([
    resolveDisplayName(thread.adminUserId),
    resolveDisplayName(thread.collectorUserId),
  ]);

  return {
    id: thread.id,
    adminUserId: thread.adminUserId,
    adminDisplayName,
    collectorUserId: thread.collectorUserId,
    collectorDisplayName,
    lastMessagePreview: lastMessage?.body.slice(0, 120),
    lastMessageAt: lastMessage?.sentAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  };
}

export async function listThreads(userId: string): Promise<MessageThreadSummary[]> {
  if (isMemoryMessagingEnabled()) {
    return listThreadsInMemory(userId);
  }

  requireDatabase();

  const db = getDb();
  const threads = await db
    .select()
    .from(messageThreads)
    .where(
      or(eq(messageThreads.adminUserId, userId), eq(messageThreads.collectorUserId, userId)),
    )
    .orderBy(desc(messageThreads.updatedAt));

  const summaries: MessageThreadSummary[] = [];
  for (const thread of threads) {
    const [lastMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, thread.id))
      .orderBy(desc(messages.sentAt))
      .limit(1);
    summaries.push(await mapThreadSummary(thread, lastMessage));
  }

  return summaries;
}

export async function getThread(threadId: string, userId: string): Promise<MessageThreadDetail> {
  if (isMemoryMessagingEnabled()) {
    return getThreadInMemory(threadId, userId);
  }

  requireDatabase();

  const thread = await assertThreadParticipant(threadId, userId);
  const db = getDb();

  const messageRows = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.sentAt);

  const summary = await mapThreadSummary(thread, messageRows[messageRows.length - 1]);

  const messageDtos: MessageDto[] = [];
  for (const row of messageRows) {
    messageDtos.push({
      id: row.id,
      threadId: row.threadId,
      senderUserId: row.senderUserId,
      senderDisplayName: await resolveDisplayName(row.senderUserId),
      body: row.body,
      sentAt: row.sentAt.toISOString(),
    });
  }

  return {
    ...summary,
    messages: messageDtos,
  };
}

export async function getOrCreateThread(
  adminId: string,
  collectorId: string,
): Promise<MessageThreadDetail> {
  if (isMemoryMessagingEnabled()) {
    return getOrCreateThreadInMemory(adminId, collectorId);
  }

  requireDatabase();

  const admin = await userRepo.getUserById(adminId);
  const collector = await userRepo.getUserById(collectorId);

  if (!admin) {
    throw new Error('VALIDATION:Admin user not found.');
  }
  if (!collector || collector.role !== USER_ROLE.COLLECTOR) {
    throw new Error('VALIDATION:Collector user not found.');
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(messageThreads)
    .where(
      and(
        eq(messageThreads.adminUserId, adminId),
        eq(messageThreads.collectorUserId, collectorId),
      ),
    )
    .limit(1);

  if (existing) {
    return getThread(existing.id, adminId);
  }

  const threadId = uuidv7();
  const now = new Date();
  await db.insert(messageThreads).values({
    id: threadId,
    adminUserId: adminId,
    collectorUserId: collectorId,
    createdAt: now,
    updatedAt: now,
  });

  return getThread(threadId, adminId);
}

export async function sendMessage(
  threadId: string,
  senderUserId: string,
  body: string,
): Promise<MessageDto> {
  if (isMemoryMessagingEnabled()) {
    return sendMessageInMemory(threadId, senderUserId, body);
  }

  requireDatabase();

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error('VALIDATION:Message body is required.');
  }

  const thread = await assertThreadParticipant(threadId, senderUserId);
  const recipientUserId =
    thread.adminUserId === senderUserId ? thread.collectorUserId : thread.adminUserId;

  const messageId = uuidv7();
  const now = new Date();
  const db = getDb();

  await db.insert(messages).values({
    id: messageId,
    threadId,
    senderUserId,
    body: trimmedBody,
    sentAt: now,
  });

  await db
    .update(messageThreads)
    .set({ updatedAt: now })
    .where(eq(messageThreads.id, threadId));

  const messageDto = {
    id: messageId,
    threadId,
    senderUserId,
    senderDisplayName: await resolveDisplayName(senderUserId),
    body: trimmedBody,
    sentAt: now.toISOString(),
  };

  void createInAppNotification({
    userId: recipientUserId,
    event: 'COMMUNICATION',
    title: 'New message',
    body: trimmedBody.slice(0, 120),
    href: '/collector/messages',
  });

  void sendPushToUser(recipientUserId, {
    title: 'New message',
    body: trimmedBody.slice(0, 120),
    url: '/collector/messages',
    category: 'MESSAGE',
  });

  return messageDto;
}
