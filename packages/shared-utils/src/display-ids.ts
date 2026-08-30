function normalizeCode(value: string, maxLength: number): string {
  const normalized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalized.slice(0, maxLength) || 'WILMS';
}

function yearFromIso(value?: string | null): string {
  const year = (value ?? new Date().toISOString()).slice(0, 4);
  return /^\d{4}$/.test(year) ? year : new Date().toISOString().slice(0, 4);
}

function paddedSequence(sequence: number, width: number): string {
  return String(Math.max(0, Math.trunc(sequence))).padStart(width, '0');
}

function sequenceFromId(id?: string, modulo = 100_000): number {
  if (!id?.trim()) {
    return 0;
  }

  const digits = id.replace(/\D/g, '');
  if (digits.length >= 1) {
    return Number(digits.slice(-5)) % modulo;
  }

  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash % modulo;
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
    return `COL-${paddedSequence(input.sequence, 3)}`;
  }

  return 'COL-000';
}

/** Official printed collector identity: "Kwame Mensah (COL-012)". */
export function formatCollectorStaffLabel(input: {
  fullName?: string | null;
  collectorCode?: string | null;
  staffId?: string | null;
  sequence?: number;
}): string {
  const name = input.fullName?.trim() || 'Collector';
  return `${name} (${formatCollectorDisplayId(input)})`;
}

export function formatLoanDisplayId(input: {
  cycleBatch: string;
  startDate?: string;
  sequence?: number;
  id?: string;
}): string {
  const year = yearFromIso(input.startDate);
  const sequence = input.sequence ?? sequenceFromId(input.id);
  return `LN-${year}-${paddedSequence(sequence, 5)}`;
}

export function formatPoolDisplayId(input: {
  region?: string;
  name?: string;
  createdAt?: string;
  sequence?: number;
}): string {
  const year = yearFromIso(input.createdAt);
  const sequence = input.sequence ?? 1;

  return `POOL-${year}-${paddedSequence(sequence, 3)}`;
}

export function formatGroupDisplayId(input: {
  systemId?: string | null;
  createdAt?: string;
  sequence?: number;
}): string {
  const systemId = input.systemId?.trim();
  if (systemId && /^(GRP|POOL|EXP|LOAN|LN)-/i.test(systemId)) {
    return systemId.toUpperCase();
  }

  const year = yearFromIso(input.createdAt);
  const sequence = input.sequence ?? 1;

  return `GRP-${year}-${paddedSequence(sequence, 3)}`;
}

export function formatExpenseDisplayId(input: {
  expenseDate?: string;
  createdAt?: string;
  sequence?: number;
}): string {
  const year = yearFromIso(input.expenseDate ?? input.createdAt);
  const sequence = input.sequence ?? 1;

  return `EXP-${year}-${paddedSequence(sequence, 3)}`;
}

export function formatEntityDisplayId(input: {
  entityType: string;
  entityId: string;
  entityName?: string;
}): string {
  const entityId = input.entityId.trim();
  if (/^(BWR|BRW|BOR|COL|GRP|LOAN|LN|POOL|ENT)-/i.test(entityId)) {
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
  const year = yearFromIso(input.registeredAt);
  const seq = sequence ?? sequenceFromId(input.id);
  return `BRW-${year}-${paddedSequence(seq, 5)}`;
}

export function formatRiskFlagDisplayId(input: {
  id?: string;
  raisedAt?: string | Date | null;
  sequence?: number;
}): string {
  const raisedAt =
    input.raisedAt instanceof Date
      ? input.raisedAt.toISOString()
      : (input.raisedAt ?? undefined);
  const year = yearFromIso(raisedAt);
  const sequence = input.sequence ?? sequenceFromId(input.id);
  return `FLG-${year}-${paddedSequence(sequence, 5)}`;
}

export function formatUserDisplayId(input: { sequence?: number; id?: string; staffId?: string }): string {
  const staffId = input.staffId?.trim();
  if (staffId) {
    return staffId.toUpperCase();
  }

  if (input.sequence != null) {
    return `USR-${paddedSequence(input.sequence, 6)}`;
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
  return `TXN-${dateKey}-${paddedSequence(sequence, 3)}`;
}

export function formatDisbursementDisplayId(input: {
  disbursedAt?: string;
  sequence?: number;
}): string {
  const year = yearFromIso(input.disbursedAt);
  const sequence = input.sequence ?? 1;
  return `DIS-${year}-${paddedSequence(sequence, 6)}`;
}

export function isReadableWilmsId(value: string): boolean {
  return /^(BWR|BRW|BOR|COL|GRP|LOAN|LN|POOL|ENT|USR|TXN|DIS|MEM|EXP|FLG)-/i.test(value.trim());
}
