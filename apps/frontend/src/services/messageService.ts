import type {
  CreateMessageThreadInput,
  MessageDto,
  MessageThreadDetail,
  MessageThreadSummary,
} from '@/types/message';
import type { IMessageService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const messageService: IMessageService = {
  listThreads(): Promise<MessageThreadSummary[]> {
    return apiClient.get<MessageThreadSummary[]>('/messages/threads');
  },

  getThread(threadId: string): Promise<MessageThreadDetail> {
    return apiClient.get<MessageThreadDetail>(`/messages/threads/${threadId}`);
  },

  createThread(input: CreateMessageThreadInput): Promise<MessageThreadDetail> {
    return apiClient.post<MessageThreadDetail>('/messages/threads', input);
  },

  sendMessage(input: { threadId: string; body: string }): Promise<MessageDto> {
    return apiClient.post<MessageDto>(`/messages/threads/${input.threadId}/messages`, {
      body: input.body,
    });
  },
};

export default messageService;
