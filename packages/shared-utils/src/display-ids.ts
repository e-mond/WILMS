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

export function formatGroupDisplayId(systemId: string | null | undefined): string {
  const normalized = systemId?.trim();
  return normalized ? normalized.toUpperCase() : 'GRP-000';
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

export function formatBorrowerDisplayId(
  input: { community: string; registeredAt: string; id?: string },
  sequence?: number,
): string {
  if (input.community && input.registeredAt && sequence != null) {
    const communityCode =
      input.community.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'WILMS';
    const monthKey = input.registeredAt.slice(0, 7).replace('-', '');

    return `BWR-${communityCode}-${monthKey}-${String(sequence).padStart(4, '0')}`;
  }

  const compactId = (input.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase() || '00000000';
  return `BWR-${compactId}`;
}

export function formatUserDisplayId(input: { sequence?: number; id?: string; staffId?: string }): string {
  const staffId = input.staffId?.trim();
  if (staffId) {
    return staffId.toUpperCase();
  }

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

export function formatDisbursementDisplayId(input: {
  disbursedAt?: string;
  sequence?: number;
}): string {
  const year = (input.disbursedAt ?? new Date().toISOString()).slice(0, 4);
  const sequence = input.sequence ?? 1;
  return `DIS-${year}-${String(sequence).padStart(6, '0')}`;
}

export function isReadableWilmsId(value: string): boolean {
  return /^(BWR|BOR|COL|GRP|LOAN|POOL|ENT|USR|TXN|DIS|MEM)-/i.test(value.trim());
}
