import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services';
import type { AuditListParams } from '@/types/services';

export function auditLogReportQueryKey(params: AuditListParams) {
  return [
    'audit-log',
    params.fromDate ?? '',
    params.toDate ?? '',
    params.actorId ?? '',
    params.action ?? '',
    params.limit ?? 100,
  ] as const;
}

export function useAuditLogReport(params: AuditListParams) {
  return useQuery({
    queryKey: auditLogReportQueryKey(params),
    queryFn: () => auditService.listRecentEntries(params),
  });
}
