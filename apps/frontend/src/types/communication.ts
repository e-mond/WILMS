export type CommunicationChannel = 'EMAIL' | 'SMS' | 'IN_APP';
export type MessageStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
export type AudienceType =
  | 'ALL_USERS'
  | 'ALL_BORROWERS'
  | 'ALL_COLLECTORS'
  | 'ALL_OFFICERS'
  | 'ALL_APPROVERS'
  | 'ALL_ADMINS'
  | 'SPECIFIC_USER'
  | 'SPECIFIC_GROUP'
  | 'CUSTOM';

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channels: CommunicationChannel[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationMessage {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channels: CommunicationChannel[];
  status: MessageStatus;
  audienceType: AudienceType;
  audienceFilter?: Record<string, unknown>;
  recipientCount: number;
  scheduledAt?: string;
  sentAt?: string;
  templateId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAnalytics {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  emailCount: number;
  smsCount: number;
  inAppCount: number;
  successRate: number;
  openRate: number;
  clickRate: number;
}

export interface FailedDelivery {
  id: string;
  event: string;
  channel: string;
  recipient: string;
  failureReason: string | null;
  retryAttempts: number;
  createdAt: string;
}

export interface CreateCommunicationMessageInput {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channels: CommunicationChannel[];
  audienceType: AudienceType;
  audienceFilter?: Record<string, unknown>;
  scheduledAt?: string;
  templateId?: string;
}

export interface CreateCommunicationTemplateInput {
  name: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channels: CommunicationChannel[];
}
