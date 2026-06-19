import type { AuditEntry, AuditListParams, IAuditService } from '@/types/services';
import type { CreateAuditEntryInput } from '@/types/audit';
import { apiClient } from '@/utils/apiClient';

function buildAuditLogQuery(params?: AuditListParams): string {
  const searchParams = new URLSearchParams();

  if (params?.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  if (params?.action) {
    searchParams.set('action', params.action);
  }

  if (params?.actorId) {
    searchParams.set('actorId', params.actorId);
  }

  if (params?.fromDate) {
    searchParams.set('fromDate', params.fromDate);
  }

  if (params?.toDate) {
    searchParams.set('toDate', params.toDate);
  }

  const query = searchParams.toString();

  return query ? `?${query}` : '';
}

const auditService: IAuditService = {
  createEntry(input: CreateAuditEntryInput): Promise<AuditEntry> {
    return apiClient.post<AuditEntry>('/audit', input);
  },

  listRecentEntries(params?: AuditListParams): Promise<AuditEntry[]> {
    return apiClient.get<AuditEntry[]>(`/audit-log${buildAuditLogQuery(params)}`);
  },
};

export default auditService;
