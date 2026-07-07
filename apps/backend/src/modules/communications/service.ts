import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { USER_ROLE } from '@wilms/shared-rbac';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import {
  communicationMessages,
  communicationTemplates,
} from '../../db/schema/communications.js';
import {
  communicationTemplateVersions,
} from '../../db/schema/communication-platform.js';
import { messageDeliveries } from '../../db/schema/message-deliveries.js';
import { users } from '../../db/schema/users.js';
import { dispatchMail } from '../../infrastructure/mail/dispatch.js';
import { createInAppNotification, createInAppNotificationsForUsers } from '../../infrastructure/notifications/in-app-notify.js';
import { getSmsProvider } from '../../infrastructure/sms/index.js';
import { logMessageDelivery } from '../../infrastructure/notifications/delivery-log.js';
import {
  extractTemplateVariables,
  previewTemplate,
  renderTemplate,
  type TemplateVariables,
} from '../../infrastructure/notifications/template-variables.js';
import { htmlToPlainText } from '../../infrastructure/notifications/html-sanitize.js';
import { shouldSendChannel } from '../notifications/preferences.service.js';
import { sendPushToUser } from '../notifications/push.service.js';
import { computeNextRunAt } from './scheduler.js';
import * as attachmentsService from './attachments.service.js';
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
  variables?: string[];
  version: number;
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
  recurrenceRule?: string;
  recurrenceTimezone?: string;
  nextRunAt?: string;
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
  deliveryRate: number;
  bounceRate: number;
  timeSeries: Array<{ date: string; sent: number; opened: number; clicked: number; failed: number }>;
  topRecipients: Array<{ recipient: string; count: number }>;
  topTemplates: Array<{ templateId: string; name: string; count: number }>;
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
    version: 1,
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
    version: 1,
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
    version: 1,
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
  const variables = row.variables as string[] | null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subject: row.subject,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    channels: row.channels as CommunicationChannel[],
    isSystem: row.isSystem,
    variables: variables ?? undefined,
    version: row.version,
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
    recurrenceRule: row.recurrenceRule ?? undefined,
    recurrenceTimezone: row.recurrenceTimezone ?? undefined,
    nextRunAt: row.nextRunAt?.toISOString(),
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
      version: 1,
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
      variables: [
        ...extractTemplateVariables(input.subject),
        ...extractTemplateVariables(input.bodyHtml),
        ...extractTemplateVariables(input.bodyText),
      ],
      version: 1,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapTemplate(row!);
}

export async function previewCommunicationTemplate(input: {
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  sampleVariables?: TemplateVariables;
}) {
  const bodyHtml = input.bodyHtml ?? '';
  const bodyText =
    input.bodyText?.trim() ||
    bodyHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .trim() ||
    '(No body content)';

  return previewTemplate({
    subject: input.subject?.trim() || '(Preview)',
    bodyHtml,
    bodyText,
    sampleVariables: input.sampleVariables,
  });
}

export async function duplicateTemplate(
  templateId: string,
  createdByUserId: string,
): Promise<CommunicationTemplateDto> {
  if (!isDatabaseEnabled()) {
    const source = memoryTemplates.find((entry) => entry.id === templateId);
    if (!source) {
      throw new Error('NOT_FOUND');
    }
    return createTemplate({
      name: `${source.name} (Copy)`,
      category: source.category,
      subject: source.subject,
      bodyHtml: source.bodyHtml,
      bodyText: source.bodyText,
      channels: source.channels,
      createdByUserId,
    });
  }

  const db = getDb();
  const [source] = await db
    .select()
    .from(communicationTemplates)
    .where(eq(communicationTemplates.id, templateId))
    .limit(1);

  if (!source) {
    throw new Error('NOT_FOUND');
  }

  return createTemplate({
    name: `${source.name} (Copy)`,
    category: source.category,
    subject: source.subject,
    bodyHtml: source.bodyHtml,
    bodyText: source.bodyText,
    channels: source.channels as CommunicationChannel[],
    createdByUserId,
  });
}

export async function listTemplateVersions(templateId: string) {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(communicationTemplateVersions)
    .where(eq(communicationTemplateVersions.templateId, templateId))
    .orderBy(desc(communicationTemplateVersions.versionNumber));

  return rows.map((row) => ({
    id: row.id,
    templateId: row.templateId,
    versionNumber: row.versionNumber,
    subject: row.subject,
    bodyHtml: row.bodyHtml,
    bodyText: row.bodyText,
    variables: (row.variables as string[] | null) ?? [],
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function updateTemplate(
  templateId: string,
  input: {
    name?: string;
    category?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    channels?: CommunicationChannel[];
    createdByUserId: string;
  },
): Promise<CommunicationTemplateDto> {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required.');
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(communicationTemplates)
    .where(eq(communicationTemplates.id, templateId))
    .limit(1);

  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const nextVersion = existing.version + 1;
  const subject = input.subject ?? existing.subject;
  const bodyHtml = input.bodyHtml ?? existing.bodyHtml;
  const bodyText = input.bodyText ?? existing.bodyText;
  const variables = [
    ...new Set([
      ...extractTemplateVariables(subject),
      ...extractTemplateVariables(bodyHtml),
      ...extractTemplateVariables(bodyText),
    ]),
  ];

  await db.insert(communicationTemplateVersions).values({
    id: uuidv7(),
    templateId,
    versionNumber: existing.version,
    subject: existing.subject,
    bodyHtml: existing.bodyHtml,
    bodyText: existing.bodyText,
    variables: existing.variables,
    createdByUserId: input.createdByUserId,
    createdAt: new Date(),
  });

  const [row] = await db
    .update(communicationTemplates)
    .set({
      name: input.name?.trim() ?? existing.name,
      category: input.category?.trim() ?? existing.category,
      subject,
      bodyHtml,
      bodyText,
      channels: input.channels ?? existing.channels,
      variables,
      version: nextVersion,
      updatedAt: new Date(),
    })
    .where(eq(communicationTemplates.id, templateId))
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
  recurrenceRule?: string;
  recurrenceTimezone?: string;
  attachmentIds?: string[];
  createdByUserId: string;
  status?: MessageStatus;
}): Promise<CommunicationMessageDto> {
  const id = uuidv7();
  const now = new Date();
  const hasRecurrence = Boolean(input.recurrenceRule?.trim());
  const status =
    input.status ?? (input.scheduledAt || hasRecurrence ? 'SCHEDULED' : 'DRAFT');
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  const nextRunAt =
    scheduledAt ??
    (hasRecurrence
      ? computeNextRunAt(input.recurrenceRule!, now, input.recurrenceTimezone)
      : null);

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
      recurrenceRule: input.recurrenceRule,
      recurrenceTimezone: input.recurrenceTimezone,
      nextRunAt: nextRunAt?.toISOString(),
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
      scheduledAt,
      templateId: input.templateId ?? null,
      recurrenceRule: input.recurrenceRule ?? null,
      recurrenceTimezone: input.recurrenceTimezone ?? 'Africa/Accra',
      nextRunAt,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (input.attachmentIds?.length) {
    await attachmentsService.linkAttachmentsToMessage(id, input.attachmentIds);
  }

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

  if (message.status === 'SENT' && !message.recurrenceRule?.trim()) {
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
  const variables: TemplateVariables = {
    firstName: 'User',
    fullName: 'User',
  };

  const attachments = await attachmentsService.listMessageAttachments(messageId);
  const attachmentHtml =
    attachments.length > 0
      ? `<hr/><p><strong>Attachments:</strong></p><ul>${attachments
          .map((entry) => `<li><a href="${entry.url}">${entry.fileName}</a></li>`)
          .join('')}</ul>`
      : '';

  for (const recipient of recipients) {
    const recipientVars: TemplateVariables = {
      ...variables,
      firstName: recipient.displayName.split(' ')[0] ?? recipient.displayName,
      fullName: recipient.displayName,
      email: recipient.email,
    };
    const subject = renderTemplate(message.subject, recipientVars);
    const bodyHtml = renderTemplate(message.bodyHtml, recipientVars) + attachmentHtml;
    const bodyText = renderTemplate(message.bodyText, recipientVars);

    if (channels.includes('EMAIL') && recipient.email) {
      const canEmail = await shouldSendChannel(recipient.userId, 'EMAIL', 'announcement');
      if (!canEmail) continue;

      try {
        await dispatchMail({
          event: 'COMMUNICATION',
          to: recipient.email,
          subject,
          text: bodyText,
          html: bodyHtml,
          userId: recipient.userId,
          communicationMessageId: messageId,
        });
      } catch (error) {
        console.error(`[communications] email to ${recipient.email} failed:`, error);
      }
    }

    if (channels.includes('SMS')) {
      const canSms = await shouldSendChannel(recipient.userId, 'SMS', 'announcement');
      if (!canSms) continue;

      const provider = getSmsProvider();
      if (provider.isConfigured()) {
        try {
          const result = await provider.send({
            to: recipient.email,
            body: bodyText.slice(0, 160),
          });
          await logMessageDelivery({
            event: 'COMMUNICATION',
            channel: 'SMS',
            recipient: recipient.email,
            provider: result.provider,
            providerMessageId: result.id,
            bodyPreview: bodyText,
            success: true,
            userId: recipient.userId,
            communicationMessageId: messageId,
          });
        } catch (error) {
          console.error(`[communications] sms failed:`, error);
        }
      }
    }

    if (channels.includes('IN_APP')) {
      const canInApp = await shouldSendChannel(recipient.userId, 'IN_APP', 'announcement');
      if (!canInApp) continue;

      void createInAppNotification({
        userId: recipient.userId,
        event: 'COMMUNICATION',
        title: subject,
        body: bodyText,
      });
    }

    const canPush = await shouldSendChannel(recipient.userId, 'PUSH', 'announcement');
    if (canPush) {
      void sendPushToUser(recipient.userId, {
        title: subject,
        body: htmlToPlainText(bodyText).slice(0, 180),
        category: 'announcement',
      });
    }
  }

  const now = new Date();
  const isRecurring = Boolean(message.recurrenceRule?.trim());
  const nextRun = isRecurring
    ? computeNextRunAt(
        message.recurrenceRule!,
        now,
        message.recurrenceTimezone ?? 'Africa/Accra',
      )
    : null;

  const [updated] = await db
    .update(communicationMessages)
    .set({
      status: isRecurring ? 'SCHEDULED' : 'SENT',
      sentAt: now,
      lastRunAt: now,
      recipientCount: recipients.length,
      nextRunAt: nextRun,
      updatedAt: now,
    })
    .where(eq(communicationMessages.id, messageId))
    .returning();

  return mapMessage(updated!);
}

export async function getDeliveryAnalytics(): Promise<DeliveryAnalytics> {
  const empty: DeliveryAnalytics = {
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    emailCount: 0,
    smsCount: 0,
    inAppCount: 0,
    successRate: 100,
    openRate: 0,
    clickRate: 0,
    deliveryRate: 0,
    bounceRate: 0,
    timeSeries: [],
    topRecipients: [],
    topTemplates: [],
  };

  if (!isDatabaseEnabled()) {
    return empty;
  }

  const db = getDb();
  const rows = await db.select().from(messageDeliveries);
  const templates = await db.select().from(communicationTemplates);

  const totalSent = rows.filter((r) => r.success).length;
  const totalFailed = rows.filter((r) => !r.success).length;
  const totalPending = rows.filter((r) => r.status === 'PENDING').length;
  const emailCount = rows.filter((r) => r.channel === 'EMAIL').length;
  const smsCount = rows.filter((r) => r.channel === 'SMS').length;
  const delivered = rows.filter((r) => r.deliveredAt || r.status === 'DELIVERED').length;
  const bounced = rows.filter((r) => r.bouncedAt || r.status === 'BOUNCED').length;
  const opened = rows.filter((r) => r.openedAt || (r.openCount ?? 0) > 0).length;
  const clicked = rows.filter((r) => r.clickedAt || (r.clickCount ?? 0) > 0).length;
  const total = rows.length || 1;
  const emailTotal = emailCount || 1;

  const byDate = new Map<string, { sent: number; opened: number; clicked: number; failed: number }>();
  for (const row of rows) {
    const date = row.createdAt.toISOString().slice(0, 10);
    const bucket = byDate.get(date) ?? { sent: 0, opened: 0, clicked: 0, failed: 0 };
    if (row.success) bucket.sent += 1;
    else bucket.failed += 1;
    if (row.openedAt || (row.openCount ?? 0) > 0) bucket.opened += 1;
    if (row.clickedAt || (row.clickCount ?? 0) > 0) bucket.clicked += 1;
    byDate.set(date, bucket);
  }

  const recipientCounts = new Map<string, number>();
  for (const row of rows) {
    recipientCounts.set(row.recipient, (recipientCounts.get(row.recipient) ?? 0) + 1);
  }

  const templateCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.communicationMessageId) {
      templateCounts.set(
        row.communicationMessageId,
        (templateCounts.get(row.communicationMessageId) ?? 0) + 1,
      );
    }
  }

  const templateNameById = new Map(templates.map((entry) => [entry.id, entry.name]));

  return {
    totalSent,
    totalFailed,
    totalPending,
    emailCount,
    smsCount,
    inAppCount: 0,
    successRate: Math.round((totalSent / total) * 100),
    openRate: Math.round((opened / emailTotal) * 100),
    clickRate: Math.round((clicked / emailTotal) * 100),
    deliveryRate: Math.round((delivered / emailTotal) * 100),
    bounceRate: Math.round((bounced / emailTotal) * 100),
    timeSeries: [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats })),
    topRecipients: [...recipientCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([recipient, count]) => ({ recipient, count })),
    topTemplates: [...templateCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([templateId, count]) => ({
        templateId,
        name: templateNameById.get(templateId) ?? templateId,
        count,
      })),
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
        sql`COALESCE(${communicationMessages.nextRunAt}, ${communicationMessages.scheduledAt}) <= ${now}`,
      ),
    );

  let processed = 0;
  for (const message of due) {
    try {
      await sendMessage(message.id, message.createdByUserId);
      processed += 1;
    } catch (error) {
      const retryCount = (message.retryCount ?? 0) + 1;
      const maxRetries = message.maxRetries ?? 3;
      await db
        .update(communicationMessages)
        .set({
          retryCount,
          status: retryCount >= maxRetries ? 'FAILED' : 'SCHEDULED',
          nextRunAt:
            retryCount < maxRetries
              ? new Date(Date.now() + 15 * 60 * 1000)
              : message.nextRunAt,
          updatedAt: new Date(),
        })
        .where(eq(communicationMessages.id, message.id));
      console.error(`[scheduler] message ${message.id} failed:`, error);
    }
  }

  return processed;
}

export {
  attachmentsService,
};
