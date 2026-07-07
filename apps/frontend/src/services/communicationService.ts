import type {
  CommunicationMessage,
  CommunicationTemplate,
  CreateCommunicationMessageInput,
  CreateCommunicationTemplateInput,
  DeliveryAnalytics,
  FailedDelivery,
} from '@/types/communication';
import type { ICommunicationService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const communicationService: ICommunicationService = {
  listTemplates(): Promise<CommunicationTemplate[]> {
    return apiClient.get<CommunicationTemplate[]>('/communications/templates');
  },

  createTemplate(input: CreateCommunicationTemplateInput): Promise<CommunicationTemplate> {
    return apiClient.post<CommunicationTemplate>('/communications/templates', input);
  },

  listMessages(status?: string): Promise<CommunicationMessage[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient.get<CommunicationMessage[]>(`/communications/messages${query}`);
  },

  createMessage(input: CreateCommunicationMessageInput): Promise<CommunicationMessage> {
    return apiClient.post<CommunicationMessage>('/communications/messages', input);
  },

  sendMessage(messageId: string): Promise<CommunicationMessage> {
    return apiClient.post<CommunicationMessage>(`/communications/messages/${messageId}/send`, {});
  },

  getAnalytics(): Promise<DeliveryAnalytics> {
    return apiClient.get<DeliveryAnalytics>('/communications/analytics');
  },

  listFailedDeliveries(): Promise<FailedDelivery[]> {
    return apiClient.get<FailedDelivery[]>('/communications/failed');
  },

  searchDeliveryLogs(query?: string): Promise<unknown[]> {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return apiClient.get<unknown[]>(`/communications/delivery-logs${q}`);
  },
};

export default communicationService;
