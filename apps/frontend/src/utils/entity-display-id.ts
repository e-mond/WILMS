import {
  formatBorrowerDisplayId,
  formatCollectorDisplayId,
  formatEntityDisplayId,
  formatGroupDisplayId,
  formatLoanDisplayId,
  formatPoolDisplayId,
  formatUserDisplayId,
  formatPaymentDisplayId,
  isReadableWilmsId,
} from '@wilms/shared-utils';

export {
  formatBorrowerDisplayId,
  formatCollectorDisplayId,
  formatEntityDisplayId,
  formatGroupDisplayId,
  formatLoanDisplayId,
  formatPoolDisplayId,
  formatUserDisplayId,
  formatPaymentDisplayId,
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

  return loan.id;
}

export function resolvePoolDisplayId(pool: {
  id: string;
  displayId?: string;
  region?: string;
  name?: string;
}): string {
  if (pool.displayId) {
    return pool.displayId;
  }

  if (pool.region) {
    return formatPoolDisplayId({
      region: pool.region,
      name: pool.name,
      sequence: 1,
    });
  }

  return pool.id;
}

export function resolveGroupDisplayId(group: {
  id: string;
  groupSystemId?: string;
}): string {
  if (group.groupSystemId) {
    return formatGroupDisplayId(group.groupSystemId);
  }

  return isReadableWilmsId(group.id) ? group.id : group.id;
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
