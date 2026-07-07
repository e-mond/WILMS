import type {
  CommunicationMessage,
  CommunicationTemplate,
  CreateCommunicationMessageInput,
  CreateCommunicationTemplateInput,
  DeliveryAnalytics,
  FailedDelivery,
} from '@/types/communication';
import type { ICommunicationService } from '@/types/services';

const templates: CommunicationTemplate[] = [
  {
    id: 'tpl-welcome',
    name: 'Welcome',
    category: 'onboarding',
    subject: 'Welcome to WILMS',
    bodyHtml: '<p>Welcome to WILMS!</p>',
    bodyText: 'Welcome to WILMS!',
    channels: ['EMAIL', 'IN_APP'],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const messages: CommunicationMessage[] = [];

const communicationService: ICommunicationService = {
  async listTemplates() {
    return templates;
  },

  async createTemplate(input: CreateCommunicationTemplateInput) {
    const template: CommunicationTemplate = {
      id: `tpl-${Date.now()}`,
      ...input,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(template);
    return template;
  },

  async listMessages(status?: string) {
    return messages.filter((m) => !status || m.status === status);
  },

  async createMessage(input: CreateCommunicationMessageInput) {
    const message: CommunicationMessage = {
      id: `msg-${Date.now()}`,
      ...input,
      status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      recipientCount: 0,
      createdByUserId: 'user-super-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    messages.unshift(message);
    return message;
  },

  async sendMessage(messageId: string) {
    const message = messages.find((m) => m.id === messageId);
    if (!message) throw new Error('Message not found');
    message.status = 'SENT';
    message.sentAt = new Date().toISOString();
    message.recipientCount = 3;
    return message;
  },

  async getAnalytics(): Promise<DeliveryAnalytics> {
    return {
      totalSent: 42,
      totalFailed: 2,
      totalPending: 1,
      emailCount: 30,
      smsCount: 12,
      inAppCount: 8,
      successRate: 95,
      openRate: 62,
      clickRate: 18,
    };
  },

  async listFailedDeliveries(): Promise<FailedDelivery[]> {
    return [];
  },

  async searchDeliveryLogs() {
    return [];
  },
};

export default communicationService;
