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
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const messages: CommunicationMessage[] = [];
const attachments: MessageAttachment[] = [];

const communicationService: ICommunicationService = {
  async listTemplates() {
    return templates;
  },

  async createTemplate(input: CreateCommunicationTemplateInput) {
    const template: CommunicationTemplate = {
      id: `tpl-${Date.now()}`,
      ...input,
      isSystem: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(template);
    return template;
  },

  async previewTemplate(input): Promise<TemplatePreviewResult> {
    return {
      subject: input.subject.replace(/\{\{firstName\}\}/g, 'Ama'),
      bodyHtml: input.bodyHtml.replace(/\{\{firstName\}\}/g, 'Ama'),
      bodyText: input.bodyText.replace(/\{\{firstName\}\}/g, 'Ama'),
      variables: ['firstName'],
    };
  },

  async duplicateTemplate(templateId: string) {
    const source = templates.find((entry) => entry.id === templateId);
    if (!source) throw new Error('Template not found');
    return this.createTemplate({
      name: `${source.name} (Copy)`,
      category: source.category,
      subject: source.subject,
      bodyHtml: source.bodyHtml,
      bodyText: source.bodyText,
      channels: source.channels,
    });
  },

  async listMessages(status?: string) {
    return messages.filter((m) => !status || m.status === status);
  },

  async createMessage(input: CreateCommunicationMessageInput) {
    const message: CommunicationMessage = {
      id: `msg-${Date.now()}`,
      ...input,
      status: input.scheduledAt || input.recurrenceRule ? 'SCHEDULED' : 'DRAFT',
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
      deliveryRate: 88,
      bounceRate: 3,
      timeSeries: [
        { date: '2026-07-01', sent: 10, opened: 6, clicked: 2, failed: 1 },
        { date: '2026-07-02', sent: 15, opened: 9, clicked: 4, failed: 0 },
      ],
      topRecipients: [{ recipient: 'admin@wilms.demo', count: 12 }],
      topTemplates: [{ templateId: 'tpl-welcome', name: 'Welcome', count: 8 }],
    };
  },

  async listFailedDeliveries(): Promise<FailedDelivery[]> {
    return [];
  },

  async searchDeliveryLogs() {
    return [];
  },

  async createAttachment(input) {
    const attachment: MessageAttachment = {
      id: `att-${Date.now()}`,
      messageId: input.messageId ?? null,
      uploadId: input.uploadId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      url: input.url ?? '#',
      createdByUserId: 'user-super-admin',
      createdAt: new Date().toISOString(),
    };
    attachments.push(attachment);
    return attachment;
  },

  async deleteAttachment(attachmentId: string) {
    const index = attachments.findIndex((entry) => entry.id === attachmentId);
    if (index >= 0) attachments.splice(index, 1);
  },

  async replaceAttachment(attachmentId, input) {
    const existing = attachments.find((entry) => entry.id === attachmentId);
    if (!existing) throw new Error('Attachment not found');
    Object.assign(existing, input);
    return existing;
  },
};

export default communicationService;
