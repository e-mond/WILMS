import { desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { messageDeliveries } from '../../db/schema/message-deliveries.js';

export type DeliveryChannel = 'EMAIL' | 'SMS';

export interface DeliveryLogInput {
  event: string;
  channel: DeliveryChannel;
  recipient: string;
  provider?: string;
  providerMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  success: boolean;
  failureReason?: string;
  retryAttempts?: number;
  trackingToken?: string;
  borrowerId?: string;
  loanId?: string;
  userId?: string;
  communicationMessageId?: string;
}

export interface DeliveryLogRecord {
  id: string;
  event: string;
  channel: DeliveryChannel;
  recipient: string;
  provider: string | null;
  providerMessageId: string | null;
  subject: string | null;
  bodyPreview: string | null;
  success: boolean;
  failureReason: string | null;
  retryAttempts: number;
  trackingToken: string | null;
  borrowerId: string | null;
  loanId: string | null;
  userId: string | null;
  createdAt: string;
}

const memoryDeliveries: DeliveryLogRecord[] = [];

function truncate(value: string, max = 500): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function mapRow(row: typeof messageDeliveries.$inferSelect): DeliveryLogRecord {
  return {
    id: row.id,
    event: row.event,
    channel: row.channel as DeliveryChannel,
    recipient: row.recipient,
    provider: row.provider,
    providerMessageId: row.providerMessageId,
    subject: row.subject,
    bodyPreview: row.bodyPreview,
    success: row.success,
    failureReason: row.failureReason,
    retryAttempts: row.retryAttempts,
    trackingToken: row.trackingToken,
    borrowerId: row.borrowerId,
    loanId: row.loanId,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function logMessageDelivery(input: DeliveryLogInput): Promise<DeliveryLogRecord> {
  const record: DeliveryLogRecord = {
    id: uuidv7(),
    event: input.event,
    channel: input.channel,
    recipient: input.recipient,
    provider: input.provider ?? null,
    providerMessageId: input.providerMessageId ?? null,
    subject: input.subject ?? null,
    bodyPreview: input.bodyPreview ? truncate(input.bodyPreview) : null,
    success: input.success,
    failureReason: input.failureReason ?? null,
    retryAttempts: input.retryAttempts ?? 0,
    trackingToken: input.trackingToken ?? null,
    borrowerId: input.borrowerId ?? null,
    loanId: input.loanId ?? null,
    userId: input.userId ?? null,
    createdAt: new Date().toISOString(),
  };

  if (!isDatabaseEnabled()) {
    memoryDeliveries.unshift(record);
    return record;
  }

  const db = getDb();
  const [row] = await db
    .insert(messageDeliveries)
    .values({
      id: record.id,
      event: record.event,
      channel: record.channel,
      recipient: record.recipient,
      provider: record.provider,
      providerMessageId: record.providerMessageId,
      subject: record.subject,
      bodyPreview: record.bodyPreview,
      success: record.success,
      failureReason: record.failureReason,
      retryAttempts: record.retryAttempts,
      trackingToken: record.trackingToken,
      borrowerId: record.borrowerId,
      loanId: record.loanId,
      userId: record.userId,
      communicationMessageId: input.communicationMessageId ?? null,
      createdAt: new Date(record.createdAt),
    })
    .returning();

  return mapRow(row!);
}

export async function listMessageDeliveries(input?: {
  event?: string;
  recipient?: string;
  limit?: number;
}): Promise<DeliveryLogRecord[]> {
  const limit = input?.limit ?? 100;

  if (!isDatabaseEnabled()) {
    return memoryDeliveries
      .filter((entry) => {
        if (input?.event && entry.event !== input.event) {
          return false;
        }
        if (input?.recipient && entry.recipient !== input.recipient) {
          return false;
        }
        return true;
      })
      .slice(0, limit);
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(messageDeliveries)
    .orderBy(desc(messageDeliveries.createdAt))
    .limit(limit);

  return rows
    .map(mapRow)
    .filter((entry) => {
      if (input?.event && entry.event !== input.event) {
        return false;
      }
      if (input?.recipient && entry.recipient !== input.recipient) {
        return false;
      }
      return true;
    });
}
