import type { IMessageService } from '@/types/services';
import { simulateDelay } from '@/services/mock/delay';

const messageServiceMock: IMessageService = {
  async listThreads() {
    await simulateDelay();
    return [];
  },

  async getThread(threadId: string) {
    await simulateDelay();
    return {
      id: threadId,
      adminUserId: 'admin-001',
      adminDisplayName: 'Super Admin',
      collectorUserId: 'collector-001',
      collectorDisplayName: 'Demo Collector',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
  },

  async createThread(input) {
    await simulateDelay();
    return this.getThread(`thread-${input.collectorId}`);
  },

  async sendMessage(input) {
    await simulateDelay();
    return {
      id: `msg-${Date.now()}`,
      threadId: input.threadId,
      senderUserId: 'admin-001',
      senderDisplayName: 'Super Admin',
      body: input.body,
      sentAt: new Date().toISOString(),
    };
  },
};

export default messageServiceMock;
