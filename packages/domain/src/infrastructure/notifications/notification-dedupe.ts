/**
 * Idempotent notification delivery gate.
 *
 * Prevents duplicate sends when schedulers or jobs rerun. Uses a unique
 * (dedupeKey, recipient, channel) constraint in PostgreSQL, or an in-memory
 * set when DATABASE_URL is not configured.
 */
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { notificationDeliveryRecords } from '../../db/schema/notification-deliveries.js';
import { recordNotificationMetric } from './notification-metrics.js';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';

export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

const memoryDedupe = new Set<string>();

function memoryKey(dedupeKey: string, recipient: string, channel: NotificationChannel): string {
  return `${dedupeKey}:${recipient}:${channel}`;
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes('unique') || message.includes('duplicate');
}

/** Attempt to claim a delivery slot. Returns false when already sent or in progress. */
export async function tryAcquireNotificationDelivery(input: {
  dedupeKey: string;
  recipient: string;
  channel: NotificationChannel;
  notificationType: string;
  correlationId?: string;
  borrowerId?: string;
  loanId?: string;
  userId?: string;
  paymentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const key = memoryKey(input.dedupeKey, input.recipient, input.channel);

  if (!isDatabaseEnabled()) {
    if (memoryDedupe.has(key)) {
      recordNotificationMetric('duplicate_prevented');
      return false;
    }
    memoryDedupe.add(key);
    return true;
  }

  const db = getDb();
  try {
    await db.insert(notificationDeliveryRecords).values({
      id: uuidv7(),
      dedupeKey: input.dedupeKey,
      recipient: input.recipient,
      channel: input.channel,
      notificationType: input.notificationType,
      status: 'PENDING',
      correlationId: input.correlationId ?? null,
      borrowerId: input.borrowerId ?? null,
      loanId: input.loanId ?? null,
      userId: input.userId ?? null,
      paymentId: input.paymentId ?? null,
      metadata: input.metadata ?? null,
    });
    recordNotificationMetric('created');
    return true;
  } catch (error) {
    if (isUniqueViolation(error)) {
      recordNotificationMetric('duplicate_prevented');
      return false;
    }
    throw error;
  }
}

export async function markNotificationDeliveryStatus(input: {
  dedupeKey: string;
  recipient: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  failureReason?: string;
  delivered?: boolean;
}): Promise<void> {
  if (!isDatabaseEnabled()) {
    if (input.status === 'SENT' || input.status === 'DELIVERED') {
      recordNotificationMetric('sent');
    }
    if (input.status === 'FAILED') {
      recordNotificationMetric('failed');
    }
    return;
  }

  const db = getDb();
  const now = new Date();
  await db
    .update(notificationDeliveryRecords)
    .set({
      status: input.status,
      sentAt: input.status === 'SENT' || input.status === 'DELIVERED' ? now : undefined,
      deliveredAt: input.delivered || input.status === 'DELIVERED' ? now : undefined,
      failedAt: input.status === 'FAILED' ? now : undefined,
      failureReason: input.failureReason ?? null,
    })
    .where(
      and(
        eq(notificationDeliveryRecords.dedupeKey, input.dedupeKey),
        eq(notificationDeliveryRecords.recipient, input.recipient),
        eq(notificationDeliveryRecords.channel, input.channel),
      ),
    );

  if (input.status === 'SENT' || input.status === 'DELIVERED') {
    recordNotificationMetric('sent');
  }
  if (input.status === 'FAILED') {
    recordNotificationMetric('failed');
  }
}

/** Test helper — reset in-memory dedupe state. */
export function resetNotificationDedupeForTests(): void {
  memoryDedupe.clear();
}
