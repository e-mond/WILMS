/**
 * In-app notifications for expense submit / approve / reject.
 * Does not alter expense approval or ledger rules.
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

export const EXPENSE_DEDUPE = {
  submitted: (expenseId: string) => `expense-submitted:${expenseId}`,
  reviewed: (expenseId: string, status: string) => `expense-reviewed:${expenseId}:${status}`,
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

async function dispatchExpenseInApp(input: {
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

/** Notify Super Admins when a collector submits an expense for review. */
export async function notifyExpenseSubmitted(input: {
  expenseId: string;
  displayId: string;
  categoryLabel: string;
  amountPesewas: number;
  recordedById: string;
  recordedByName: string;
}): Promise<void> {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const body = `${input.recordedByName} submitted ${input.categoryLabel} expense ${input.displayId} for GHS ${amountGhs}.`;
  const dedupeKey = EXPENSE_DEDUPE.submitted(input.expenseId);
  const adminIds = (await listActiveSuperAdminIds()).filter((id) => id !== input.recordedById);

  await Promise.all(
    adminIds.map((userId) =>
      dispatchExpenseInApp({
        dedupeKey,
        notificationType: 'EXPENSE_SUBMITTED',
        userId,
        title: 'Expense awaiting review',
        body,
        href: '/expenses',
        correlationId: input.expenseId,
      }),
    ),
  );
}

/** Notify the recorder when their expense is approved or rejected. */
export async function notifyExpenseReviewed(input: {
  expenseId: string;
  displayId: string;
  categoryLabel: string;
  amountPesewas: number;
  status: 'APPROVED' | 'REJECTED';
  recordedById: string;
  reviewNote?: string;
}): Promise<void> {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const approved = input.status === 'APPROVED';
  const note = input.reviewNote?.trim();
  const body = approved
    ? `Your ${input.categoryLabel} expense ${input.displayId} (GHS ${amountGhs}) was approved.`
    : `Your ${input.categoryLabel} expense ${input.displayId} (GHS ${amountGhs}) was rejected${
        note ? `: ${note}` : '.'
      }`;

  await dispatchExpenseInApp({
    dedupeKey: EXPENSE_DEDUPE.reviewed(input.expenseId, input.status),
    notificationType: approved ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
    userId: input.recordedById,
    title: approved ? 'Expense approved' : 'Expense rejected',
    body,
    href: '/collector/expenses',
    correlationId: input.expenseId,
  });
}
