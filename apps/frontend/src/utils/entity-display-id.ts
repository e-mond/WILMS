import {
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

export function resolveUserDisplayId(userId: string, sequence?: number): string {
  if (isReadableWilmsId(userId)) {
    return userId.toUpperCase();
  }

  return formatUserDisplayId({ id: userId, sequence });
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
