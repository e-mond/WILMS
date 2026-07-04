function normalizeCode(value: string, maxLength: number): string {
  const normalized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalized.slice(0, maxLength) || 'WILMS';
}

export function formatCollectorDisplayId(input: {
  collectorCode?: string | null;
  staffId?: string | null;
  sequence?: number;
}): string {
  const collectorCode = input.collectorCode?.trim();
  if (collectorCode) {
    return collectorCode.toUpperCase();
  }

  const staffId = input.staffId?.trim();
  if (staffId) {
    return staffId.toUpperCase();
  }

  if (input.sequence != null) {
    return `COL-${String(input.sequence).padStart(3, '0')}`;
  }

  return 'COL-000';
}

export function formatLoanDisplayId(input: {
  cycleBatch: string;
  startDate?: string;
  sequence?: number;
}): string {
  const batchCode = normalizeCode(input.cycleBatch, 8);
  const monthKey = (input.startDate ?? new Date().toISOString()).slice(0, 7).replace('-', '');
  const sequence = input.sequence ?? 1;

  return `LOAN-${batchCode}-${monthKey}-${String(sequence).padStart(4, '0')}`;
}

export function formatPoolDisplayId(input: {
  region: string;
  name?: string;
  sequence?: number;
}): string {
  const regionCode = normalizeCode(input.region, 3);
  const sequence = input.sequence ?? 1;

  return `POOL-${regionCode}-${String(sequence).padStart(3, '0')}`;
}

export function formatGroupDisplayId(systemId: string): string {
  return systemId.trim().toUpperCase();
}

export function formatEntityDisplayId(input: {
  entityType: string;
  entityId: string;
  entityName?: string;
}): string {
  const entityId = input.entityId.trim();
  if (/^(BWR|COL|GRP|LOAN|POOL|ENT)-/i.test(entityId)) {
    return entityId.toUpperCase();
  }

  const typeCode = normalizeCode(input.entityType, 3);
  const nameCode = input.entityName ? normalizeCode(input.entityName, 4) : '';
  const suffix = entityId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '0000';

  return nameCode
    ? `ENT-${typeCode}-${nameCode}-${suffix}`
    : `ENT-${typeCode}-${suffix}`;
}

export function formatUserDisplayId(input: { sequence?: number; id?: string }): string {
  if (input.sequence != null) {
    return `USR-${String(input.sequence).padStart(6, '0')}`;
  }

  const suffix = input.id?.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() ?? '0000';
  return `USR-${suffix}`;
}

export function formatPaymentDisplayId(input: {
  recordedAt?: string;
  sequence?: number;
}): string {
  const dateKey = (input.recordedAt ?? new Date().toISOString()).slice(0, 10).replace(/-/g, '');
  const sequence = input.sequence ?? 1;
  return `TXN-${dateKey}-${String(sequence).padStart(3, '0')}`;
}

export function isReadableWilmsId(value: string): boolean {
  return /^(BWR|COL|GRP|LOAN|POOL|ENT|USR|TXN)-/i.test(value.trim());
}
