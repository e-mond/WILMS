/**
 * In-app notifications for financial adjustment requests.
 */
import { and, eq, isNull } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { users } from '../../db/schema/users.js';
import { createInAppNotification } from './in-app-notify.js';
import {
  markNotificationDeliveryStatus,
  tryAcquireNotificationDelivery,
} from './notification-dedupe.js';
import { formatGhsAmount } from './templates.js';

export const ADJUSTMENT_DEDUPE = {
  requested: (adjustmentId: string) => `adjustment-requested:${adjustmentId}`,
} as const;

async function listActiveSuperAdminIds(): Promise<string[]> {
  if (!isDatabaseEnabled()) {
    return [];
  }
  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.role, USER_ROLE.SUPER_ADMIN),
        eq(users.status, 'ACTIVE'),
        isNull(users.deletedAt),
      ),
    );
  return rows.map((row) => row.id);
}

async function dispatchAdjustmentInApp(input: {
  dedupeKey: string;
  notificationType: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  correlationId: string;
}): Promise<boolean> {
  if (!input.userId.trim()) {
    return false;
  }

  const acquired = await tryAcquireNotificationDelivery({
    dedupeKey: input.dedupeKey,
    recipient: input.userId,
    channel: 'IN_APP',
    notificationType: input.notificationType,
    correlationId: input.correlationId,
    userId: input.userId,
  });
  if (!acquired) {
    return false;
  }

  await createInAppNotification({
    userId: input.userId,
    event: 'SUPERVISOR_ALERT',
    title: input.title,
    body: input.body,
    href: input.href,
    dedupeKey: input.dedupeKey,
    correlationId: input.correlationId,
  });

  await markNotificationDeliveryStatus({
    dedupeKey: input.dedupeKey,
    recipient: input.userId,
    channel: 'IN_APP',
    status: 'SENT',
  });
  return true;
}

/** Notify Super Admins when a collector submits an adjustment for review. */
export async function notifyAdjustmentRequested(input: {
  adjustmentId: string;
  displayId: string;
  typeLabel: string;
  borrowerName: string;
  amountPesewas: number;
  requestedByUserId: string;
  requestedByDisplayName: string;
}): Promise<void> {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const body = `${input.requestedByDisplayName} requested ${input.typeLabel} (${input.displayId}) for ${input.borrowerName}: GHS ${amountGhs}.`;
  const dedupeKey = ADJUSTMENT_DEDUPE.requested(input.adjustmentId);
  const adminIds = (await listActiveSuperAdminIds()).filter(
    (id) => id !== input.requestedByUserId,
  );

  await Promise.all(
    adminIds.map((userId) =>
      dispatchAdjustmentInApp({
        dedupeKey,
        notificationType: 'ADJUSTMENT_REQUESTED',
        userId,
        title: 'Adjustment awaiting review',
        body,
        href: '/adjustments',
        correlationId: input.adjustmentId,
      }),
    ),
  );
}
