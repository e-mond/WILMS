import { uuidv7 } from 'uuidv7';
import { USER_ROLE } from '@wilms/shared-rbac';
import { isDatabaseEnabled } from '../../db/client.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import type {
  MessageDto,
  MessageThreadDetail,
  MessageThreadSummary,
} from './service.js';

interface MemoryThread {
  id: string;
  adminUserId: string;
  collectorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryMessage {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  sentAt: Date;
}

const memoryThreads = new Map<string, MemoryThread>();
const memoryMessages = new Map<string, MemoryMessage[]>();

function resetMemoryStore(): void {
  memoryThreads.clear();
  memoryMessages.clear();
}

function resolveDemoUser(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId);
}

function resolveDemoDisplayName(userId: string): string {
  return resolveDemoUser(userId)?.displayName ?? 'User';
}

function assertDemoCollector(collectorId: string): void {
  const collector = resolveDemoUser(collectorId);
  if (!collector || collector.role !== USER_ROLE.COLLECTOR) {
    throw new Error('VALIDATION:Collector user not found.');
  }
}

function assertDemoAdmin(adminId: string): void {
  const admin = resolveDemoUser(adminId);
  if (!admin) {
    throw new Error('VALIDATION:Admin user not found.');
  }
}

function mapMemoryThreadSummary(
  thread: MemoryThread,
  lastMessage?: MemoryMessage,
): MessageThreadSummary {
  return {
    id: thread.id,
    adminUserId: thread.adminUserId,
    adminDisplayName: resolveDemoDisplayName(thread.adminUserId),
    collectorUserId: thread.collectorUserId,
    collectorDisplayName: resolveDemoDisplayName(thread.collectorUserId),
    lastMessagePreview: lastMessage?.body.slice(0, 120),
    lastMessageAt: lastMessage?.sentAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  };
}

function getMemoryThreadMessages(threadId: string): MemoryMessage[] {
  return [...(memoryMessages.get(threadId) ?? [])].sort(
    (left, right) => left.sentAt.getTime() - right.sentAt.getTime(),
  );
}

function assertMemoryParticipant(threadId: string, userId: string): MemoryThread {
  const thread = memoryThreads.get(threadId);
  if (!thread) {
    throw new Error('NOT_FOUND');
  }

  if (thread.adminUserId !== userId && thread.collectorUserId !== userId) {
    throw new Error('UNAUTHORIZED');
  }

  return thread;
}

export function listThreadsInMemory(userId: string): MessageThreadSummary[] {
  const summaries = [...memoryThreads.values()]
    .filter((thread) => thread.adminUserId === userId || thread.collectorUserId === userId)
    .map((thread) => {
      const messages = getMemoryThreadMessages(thread.id);
      return mapMemoryThreadSummary(thread, messages[messages.length - 1]);
    });

  return summaries.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function getThreadInMemory(threadId: string, userId: string): MessageThreadDetail {
  const thread = assertMemoryParticipant(threadId, userId);
  const messageRows = getMemoryThreadMessages(threadId);
  const summary = mapMemoryThreadSummary(thread, messageRows[messageRows.length - 1]);

  return {
    ...summary,
    messages: messageRows.map((row) => ({
      id: row.id,
      threadId: row.threadId,
      senderUserId: row.senderUserId,
      senderDisplayName: resolveDemoDisplayName(row.senderUserId),
      body: row.body,
      sentAt: row.sentAt.toISOString(),
    })),
  };
}

export function getOrCreateThreadInMemory(
  adminId: string,
  collectorId: string,
): MessageThreadDetail {
  assertDemoAdmin(adminId);
  assertDemoCollector(collectorId);

  const existing = [...memoryThreads.values()].find(
    (thread) => thread.adminUserId === adminId && thread.collectorUserId === collectorId,
  );

  if (existing) {
    return getThreadInMemory(existing.id, adminId);
  }

  const now = new Date();
  const threadId = uuidv7();
  memoryThreads.set(threadId, {
    id: threadId,
    adminUserId: adminId,
    collectorUserId: collectorId,
    createdAt: now,
    updatedAt: now,
  });
  memoryMessages.set(threadId, []);

  return getThreadInMemory(threadId, adminId);
}

export function sendMessageInMemory(
  threadId: string,
  senderUserId: string,
  body: string,
): MessageDto {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error('VALIDATION:Message body is required.');
  }

  const thread = assertMemoryParticipant(threadId, senderUserId);
  const now = new Date();
  const messageId = uuidv7();

  const message: MemoryMessage = {
    id: messageId,
    threadId,
    senderUserId,
    body: trimmedBody,
    sentAt: now,
  };

  const threadMessages = memoryMessages.get(threadId) ?? [];
  threadMessages.push(message);
  memoryMessages.set(threadId, threadMessages);
  memoryThreads.set(threadId, { ...thread, updatedAt: now });

  return {
    id: messageId,
    threadId,
    senderUserId,
    senderDisplayName: resolveDemoDisplayName(senderUserId),
    body: trimmedBody,
    sentAt: now.toISOString(),
  };
}

export function isMemoryMessagingEnabled(): boolean {
  return !isDatabaseEnabled();
}

export { resetMemoryStore };
