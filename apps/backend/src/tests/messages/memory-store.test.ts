import { beforeEach, describe, expect, it } from 'vitest';
import {
  getOrCreateThreadInMemory,
  listThreadsInMemory,
  resetMemoryStore,
  sendMessageInMemory,
} from '../../modules/messages/memory-store.js';

describe('messages memory store', () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it('creates a thread for demo collector ids', async () => {
    const thread = getOrCreateThreadInMemory('user-super-admin', 'user-collector');

    expect(thread.collectorUserId).toBe('user-collector');
    expect(thread.adminUserId).toBe('user-super-admin');
    expect(thread.messages).toEqual([]);
  });

  it('reuses an existing thread and records messages', () => {
    const created = getOrCreateThreadInMemory('user-super-admin', 'user-collector');
    const message = sendMessageInMemory(created.id, 'user-super-admin', 'Please check Zone 3 today.');
    const reopened = getOrCreateThreadInMemory('user-super-admin', 'user-collector');
    const threads = listThreadsInMemory('user-super-admin');

    expect(reopened.id).toBe(created.id);
    expect(message.body).toBe('Please check Zone 3 today.');
    expect(threads).toHaveLength(1);
    expect(threads[0]?.lastMessagePreview).toBe('Please check Zone 3 today.');
  });

  it('rejects unknown collector ids', () => {
    expect(() => getOrCreateThreadInMemory('user-super-admin', 'COL-001')).toThrow(
      'VALIDATION:Collector user not found.',
    );
  });
});
