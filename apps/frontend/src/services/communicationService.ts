import type {
  CommunicationMessage,
  CommunicationTemplate,
  CreateCommunicationMessageInput,
  CreateCommunicationTemplateInput,
  DeliveryAnalytics,
  FailedDelivery,
  MessageAttachment,
  TemplatePreviewResult,
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

  previewTemplate(input: {
    subject: string;
    bodyHtml: string;
    bodyText: string;
    sampleVariables?: Record<string, string>;
  }): Promise<TemplatePreviewResult> {
    return apiClient.post<TemplatePreviewResult>('/communications/templates/preview', input);
  },

  duplicateTemplate(templateId: string): Promise<CommunicationTemplate> {
    return apiClient.post<CommunicationTemplate>(`/communications/templates/${templateId}/duplicate`, {});
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

  createAttachment(input: {
    messageId?: string;
    uploadId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url?: string;
  }): Promise<MessageAttachment> {
    return apiClient.post<MessageAttachment>('/communications/attachments', input);
  },

  deleteAttachment(attachmentId: string): Promise<void> {
    return apiClient.delete(`/communications/attachments/${attachmentId}`);
  },

  replaceAttachment(
    attachmentId: string,
    input: {
      uploadId: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      url?: string;
    },
  ): Promise<MessageAttachment> {
    return apiClient.patch<MessageAttachment>(`/communications/attachments/${attachmentId}`, input);
  },
};

export default communicationService;
