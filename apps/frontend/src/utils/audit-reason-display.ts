import { isReadableWilmsId } from '@wilms/shared-utils';

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/** Strip or flag raw UUID fragments in audit reason text for operator-readable logs. */
export function resolveAuditReason(reason: string | undefined | null): string {
  if (!reason?.trim()) {
    return '—';
  }

  const trimmed = reason.trim();
  if (UUID_PATTERN.test(trimmed) && trimmed.replace(UUID_PATTERN, '').trim().length === 0) {
    return 'System reference recorded';
  }

  UUID_PATTERN.lastIndex = 0;
  return trimmed.replace(UUID_PATTERN, (match) =>
    isReadableWilmsId(match) ? match : '(reference)',
  );
}
