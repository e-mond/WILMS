import {
  formatBorrowerDisplayId,
  formatCollectorDisplayId,
  formatEntityDisplayId,
  formatExpenseDisplayId,
  formatGroupDisplayId,
  formatLoanDisplayId,
  formatPoolDisplayId,
  formatUserDisplayId,
  formatPaymentDisplayId,
  formatDisbursementDisplayId,
  isReadableWilmsId,
} from '@wilms/shared-utils';

export {
  formatBorrowerDisplayId,
  formatCollectorDisplayId,
  formatEntityDisplayId,
  formatExpenseDisplayId,
  formatGroupDisplayId,
  formatLoanDisplayId,
  formatPoolDisplayId,
  formatUserDisplayId,
  formatPaymentDisplayId,
  formatDisbursementDisplayId,
  isReadableWilmsId,
};

export function resolveCollectorDisplayId(
  collector: { id: string; displayId?: string },
  sequence?: number,
): string {
  if (collector.displayId) {
    return collector.displayId;
  }

  if (isReadableWilmsId(collector.id)) {
    return collector.id.toUpperCase();
  }

  return formatCollectorDisplayId({ sequence });
}

export function resolveLoanDisplayId(loan: {
  id: string;
  displayId?: string;
  cycleBatch?: string;
  startDate?: string;
}): string {
  if (loan.displayId) {
    return loan.displayId;
  }

  if (loan.cycleBatch) {
    return formatLoanDisplayId({
      cycleBatch: loan.cycleBatch,
      startDate: loan.startDate,
      sequence: 1,
    });
  }

  if (isReadableWilmsId(loan.id)) {
    return loan.id.toUpperCase();
  }

  return formatEntityDisplayId({
    entityType: 'LOAN',
    entityId: loan.id,
  });
}

export function resolvePoolDisplayId(pool: {
  id: string;
  displayId?: string;
  region?: string;
  name?: string;
  createdAt?: string;
}): string {
  if (pool.displayId) {
    return pool.displayId;
  }

  if (pool.region || pool.createdAt) {
    return formatPoolDisplayId({
      createdAt: pool.createdAt,
      sequence: 1,
    });
  }

  if (isReadableWilmsId(pool.id)) {
    return pool.id.toUpperCase();
  }

  return formatEntityDisplayId({
    entityType: 'POOL',
    entityId: pool.id,
    entityName: pool.name,
  });
}

export function resolveGroupDisplayId(group: {
  id: string;
  groupSystemId?: string;
  formedAt?: string;
  displayId?: string;
}): string {
  if (group.displayId) {
    return group.displayId;
  }

  if (group.groupSystemId) {
    return formatGroupDisplayId({
      systemId: group.groupSystemId,
      createdAt: group.formedAt,
    });
  }

  return isReadableWilmsId(group.id)
    ? group.id.toUpperCase()
    : formatGroupDisplayId({ createdAt: group.formedAt });
}

export function resolveExpenseDisplayId(
  expense: { id: string; displayId?: string; expenseDate?: string; createdAt?: string },
  sequence?: number,
): string {
  if (expense.displayId) {
    return expense.displayId;
  }

  if (isReadableWilmsId(expense.id)) {
    return expense.id.toUpperCase();
  }

  return formatExpenseDisplayId({
    expenseDate: expense.expenseDate,
    createdAt: expense.createdAt,
    sequence,
  });
}

export function resolveUserDisplayId(
  user:
    | string
    | null
    | undefined
    | { id: string; displayId?: string; staffId?: string | null },
  sequence?: number,
): string {
  if (user && typeof user === 'object') {
    if (user.displayId) {
      return user.displayId;
    }

    return resolveUserDisplayId(user.id, sequence);
  }

  const userId = user;

  if (!userId?.trim()) {
    return formatUserDisplayId({ sequence });
  }

  if (isReadableWilmsId(userId)) {
    return userId.toUpperCase();
  }

  return formatUserDisplayId({ id: userId, sequence });
}

export function resolvePaymentDisplayId(
  payment: { id: string; displayId?: string; recordedAt?: string },
  sequence?: number,
): string {
  if (payment.displayId) {
    return payment.displayId;
  }

  if (isReadableWilmsId(payment.id)) {
    return payment.id.toUpperCase();
  }

  return formatPaymentDisplayId({
    recordedAt: payment.recordedAt,
    sequence,
  });
}

export function resolveDisbursementDisplayId(entry: {
  id: string;
  displayId?: string;
  recordedAt?: string;
}): string {
  if (entry.displayId) {
    return entry.displayId;
  }

  if (isReadableWilmsId(entry.id)) {
    return entry.id.toUpperCase();
  }

  return formatDisbursementDisplayId({ disbursedAt: entry.recordedAt });
}

export function resolveEntityDisplayId(flag: {
  entityId: string;
  entityDisplayId?: string;
  entityType?: string;
  entityName?: string;
}): string {
  return (
    flag.entityDisplayId ??
    formatEntityDisplayId({
      entityType: flag.entityType ?? 'ENTITY',
      entityId: flag.entityId,
      entityName: flag.entityName,
    })
  );
}
