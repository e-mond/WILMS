import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { USER_ROLE } from '@wilms/shared-rbac';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import {
  communicationMessages,
  communicationTemplates,
} from '../../db/schema/communications.js';
import { messageDeliveries } from '../../db/schema/message-deliveries.js';
import { users } from '../../db/schema/users.js';
import { dispatchMail } from '../../infrastructure/mail/dispatch.js';
import { createInAppNotification, createInAppNotificationsForUsers } from '../../infrastructure/notifications/in-app-notify.js';
import { getSmsProvider } from '../../infrastructure/sms/index.js';
import { logMessageDelivery } from '../../infrastructure/notifications/delivery-log.js';
import * as userRepo from '../../repositories/user.repository.js';

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

export interface CommunicationTemplateDto {
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

export interface CommunicationMessageDto {
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

const memoryTemplates: CommunicationTemplateDto[] = [
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
  {
    id: 'tpl-reminder',
    name: 'Payment Reminder',
    category: 'reminder',
    subject: 'Payment Reminder',
    bodyHtml: '<p>Your payment is due soon.</p>',
    bodyText: 'Your payment is due soon.',
    channels: ['EMAIL', 'SMS'],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-announcement',
    name: 'Announcement',
    category: 'announcement',
    subject: 'Important Announcement',
    bodyHtml: '<p>We have an important announcement.</p>',
    bodyText: 'We have an important announcement.',
    channels: ['EMAIL', 'IN_APP'],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const memoryMessages: CommunicationMessageDto[] = [];

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for communications.');
  }
}

function mapTemplate(row: typeof communicationTemplates.$inferSelect): CommunicationTemplateDto {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subject: row.subject,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    channels: row.channels as CommunicationChannel[],
    isSystem: row.isSystem,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapMessage(row: typeof communicationMessages.$inferSelect): CommunicationMessageDto {
  return {
    id: row.id,
    subject: row.subject,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    channels: row.channels as CommunicationChannel[],
    status: row.status as MessageStatus,
    audienceType: row.audienceType as AudienceType,
    audienceFilter: (row.audienceFilter as Record<string, unknown>) ?? undefined,
    recipientCount: row.recipientCount,
    scheduledAt: row.scheduledAt?.toISOString(),
    sentAt: row.sentAt?.toISOString(),
    templateId: row.templateId ?? undefined,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTemplates(): Promise<CommunicationTemplateDto[]> {
  if (!isDatabaseEnabled()) {
    return memoryTemplates;
  }

  const db = getDb();
  const rows = await db.select().from(communicationTemplates).orderBy(communicationTemplates.name);
  return rows.map(mapTemplate);
}

export async function createTemplate(input: {
  name: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channels: CommunicationChannel[];
  createdByUserId: string;
}): Promise<CommunicationTemplateDto> {
  const id = uuidv7();
  const now = new Date();

  if (!isDatabaseEnabled()) {
    const template: CommunicationTemplateDto = {
      id,
      name: input.name,
      category: input.category,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText,
      channels: input.channels,
      isSystem: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    memoryTemplates.push(template);
    return template;
  }

  const db = getDb();
  const [row] = await db
    .insert(communicationTemplates)
    .values({
      id,
      name: input.name.trim(),
      category: input.category.trim(),
      subject: input.subject.trim(),
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText,
      channels: input.channels,
      isSystem: false,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapTemplate(row!);
}

export async function resolveAudienceRecipients(
  audienceType: AudienceType,
  filter?: Record<string, unknown>,
): Promise<Array<{ userId: string; email: string; phone?: string; displayName: string }>> {
  if (!isDatabaseEnabled()) {
    return [{ userId: 'user-super-admin', email: 'admin@wilms.demo', displayName: 'Admin' }];
  }

  const db = getDb();
  const baseQuery = db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .where(and(isNull(users.deletedAt), eq(users.status, 'ACTIVE')));

  let rows = await baseQuery;

  switch (audienceType) {
    case 'ALL_COLLECTORS':
      rows = rows.filter((r) => r.role === USER_ROLE.COLLECTOR);
      break;
    case 'ALL_OFFICERS':
      rows = rows.filter((r) => r.role === USER_ROLE.REGISTRATION_OFFICER);
      break;
    case 'ALL_APPROVERS':
      rows = rows.filter((r) => r.role === USER_ROLE.APPROVER);
      break;
    case 'ALL_ADMINS':
      rows = rows.filter((r) => r.role === USER_ROLE.SUPER_ADMIN);
      break;
    case 'SPECIFIC_USER': {
      const userId = String(filter?.userId ?? '');
      rows = rows.filter((r) => r.id === userId);
      break;
    }
    case 'ALL_USERS':
    default:
      break;
  }

  return rows.map((r) => ({
    userId: r.id,
    email: r.email,
    displayName: r.displayName,
  }));
}

export async function createMessage(input: {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channels: CommunicationChannel[];
  audienceType: AudienceType;
  audienceFilter?: Record<string, unknown>;
  scheduledAt?: string;
  templateId?: string;
  createdByUserId: string;
  status?: MessageStatus;
}): Promise<CommunicationMessageDto> {
  const id = uuidv7();
  const now = new Date();
  const status = input.status ?? (input.scheduledAt ? 'SCHEDULED' : 'DRAFT');

  if (!isDatabaseEnabled()) {
    const message: CommunicationMessageDto = {
      id,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText,
      channels: input.channels,
      status,
      audienceType: input.audienceType,
      audienceFilter: input.audienceFilter,
      recipientCount: 0,
      scheduledAt: input.scheduledAt,
      templateId: input.templateId,
      createdByUserId: input.createdByUserId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    memoryMessages.unshift(message);
    return message;
  }

  const db = getDb();
  const [row] = await db
    .insert(communicationMessages)
    .values({
      id,
      subject: input.subject.trim(),
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText,
      channels: input.channels,
      status,
      audienceType: input.audienceType,
      audienceFilter: input.audienceFilter ?? null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      templateId: input.templateId ?? null,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapMessage(row!);
}

export async function listMessages(filter?: {
  status?: MessageStatus;
  limit?: number;
}): Promise<CommunicationMessageDto[]> {
  const limit = filter?.limit ?? 100;

  if (!isDatabaseEnabled()) {
    return memoryMessages
      .filter((m) => !filter?.status || m.status === filter.status)
      .slice(0, limit);
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(communicationMessages)
    .orderBy(desc(communicationMessages.createdAt))
    .limit(limit);

  return rows
    .map(mapMessage)
    .filter((m) => !filter?.status || m.status === filter.status);
}

export async function sendMessage(messageId: string, actorUserId: string): Promise<CommunicationMessageDto> {
  requireDatabase();
  const db = getDb();

  const [message] = await db
    .select()
    .from(communicationMessages)
    .where(eq(communicationMessages.id, messageId))
    .limit(1);

  if (!message) {
    throw new Error('NOT_FOUND');
  }

  if (message.status === 'SENT') {
    throw new Error('VALIDATION:Message has already been sent.');
  }

  const recipients = await resolveAudienceRecipients(
    message.audienceType as AudienceType,
    (message.audienceFilter as Record<string, unknown>) ?? undefined,
  );

  await db
    .update(communicationMessages)
    .set({ status: 'SENDING', updatedAt: new Date() })
    .where(eq(communicationMessages.id, messageId));

  const channels = message.channels as CommunicationChannel[];

  for (const recipient of recipients) {
    if (channels.includes('EMAIL') && recipient.email) {
      try {
        await dispatchMail({
          event: 'COMMUNICATION',
          to: recipient.email,
          subject: message.subject,
          text: message.bodyText,
          html: message.bodyHtml,
          userId: recipient.userId,
        });
      } catch (error) {
        console.error(`[communications] email to ${recipient.email} failed:`, error);
      }
    }

    if (channels.includes('SMS')) {
      const provider = getSmsProvider();
      if (provider.isConfigured()) {
        try {
          const result = await provider.send({
            to: recipient.email,
            body: message.bodyText.slice(0, 160),
          });
          await logMessageDelivery({
            event: 'COMMUNICATION',
            channel: 'SMS',
            recipient: recipient.email,
            provider: result.provider,
            providerMessageId: result.id,
            bodyPreview: message.bodyText,
            success: true,
            userId: recipient.userId,
          });
        } catch (error) {
          console.error(`[communications] sms failed:`, error);
        }
      }
    }

    if (channels.includes('IN_APP')) {
      void createInAppNotification({
        userId: recipient.userId,
        event: 'COMMUNICATION',
        title: message.subject,
        body: message.bodyText,
      });
    }
  }

  const now = new Date();
  const [updated] = await db
    .update(communicationMessages)
    .set({
      status: 'SENT',
      sentAt: now,
      recipientCount: recipients.length,
      updatedAt: now,
    })
    .where(eq(communicationMessages.id, messageId))
    .returning();

  return mapMessage(updated!);
}

export async function getDeliveryAnalytics(): Promise<DeliveryAnalytics> {
  if (!isDatabaseEnabled()) {
    return {
      totalSent: 0,
      totalFailed: 0,
      totalPending: 0,
      emailCount: 0,
      smsCount: 0,
      inAppCount: 0,
      successRate: 100,
      openRate: 0,
      clickRate: 0,
    };
  }

  const db = getDb();
  const rows = await db.select().from(messageDeliveries);

  const totalSent = rows.filter((r) => r.success).length;
  const totalFailed = rows.filter((r) => !r.success).length;
  const totalPending = rows.filter((r) => r.status === 'PENDING').length;
  const emailCount = rows.filter((r) => r.channel === 'EMAIL').length;
  const smsCount = rows.filter((r) => r.channel === 'SMS').length;
  const opened = rows.filter((r) => r.openedAt).length;
  const clicked = rows.filter((r) => r.clickedAt).length;
  const total = rows.length || 1;

  return {
    totalSent,
    totalFailed,
    totalPending,
    emailCount,
    smsCount,
    inAppCount: 0,
    successRate: Math.round((totalSent / total) * 100),
    openRate: Math.round((opened / total) * 100),
    clickRate: Math.round((clicked / total) * 100),
  };
}

export async function listFailedDeliveries(limit = 50) {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(messageDeliveries)
    .where(eq(messageDeliveries.success, false))
    .orderBy(desc(messageDeliveries.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    event: r.event,
    channel: r.channel,
    recipient: r.recipient,
    failureReason: r.failureReason,
    retryAttempts: r.retryAttempts,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function searchDeliveryLogs(query?: string, limit = 100) {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();
  let q = db.select().from(messageDeliveries).orderBy(desc(messageDeliveries.createdAt)).limit(limit);

  if (query?.trim()) {
    const pattern = `%${query.trim()}%`;
    const rows = await db
      .select()
      .from(messageDeliveries)
      .where(
        or(
          ilike(messageDeliveries.recipient, pattern),
          ilike(messageDeliveries.event, pattern),
          ilike(messageDeliveries.subject, pattern),
        ),
      )
      .orderBy(desc(messageDeliveries.createdAt))
      .limit(limit);
    return rows;
  }

  return q;
}

export async function processScheduledMessages(): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  const db = getDb();
  const now = new Date();
  const due = await db
    .select()
    .from(communicationMessages)
    .where(
      and(
        eq(communicationMessages.status, 'SCHEDULED'),
        sql`${communicationMessages.scheduledAt} <= ${now}`,
      ),
    );

  let processed = 0;
  for (const message of due) {
    await sendMessage(message.id, message.createdByUserId);
    processed += 1;
  }

  return processed;
}
