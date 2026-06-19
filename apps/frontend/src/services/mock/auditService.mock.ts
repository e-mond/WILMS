import type { AuditEntry, AuditListParams, IAuditService } from '@/types/services';
import type { CreateAuditEntryInput } from '@/types/audit';
import {
  appendAuditEntry,
  getAuditEntries,
  resetAuditLog,
} from '@/services/mock/audit-log.store';
import { simulateDelay } from '@/services/mock/delay';

function filterAuditEntries(entries: AuditEntry[], params?: AuditListParams): AuditEntry[] {
  const limit = params?.limit ?? 50;

  return [...entries]
    .filter((entry) => {
      if (params?.action && entry.action !== params.action) {
        return false;
      }

      if (params?.actorId && entry.actorId !== params.actorId) {
        return false;
      }

      const entryDate = entry.createdAt.slice(0, 10);

      if (params?.fromDate && entryDate < params.fromDate) {
        return false;
      }

      if (params?.toDate && entryDate > params.toDate) {
        return false;
      }

      return true;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);
}

const auditServiceMock: IAuditService = {
  async createEntry(input: CreateAuditEntryInput): Promise<AuditEntry> {
    await simulateDelay();
    return appendAuditEntry(input);
  },

  async listRecentEntries(params?: AuditListParams): Promise<AuditEntry[]> {
    await simulateDelay();
    return filterAuditEntries([...getAuditEntries()], params);
  },
};

export function resetMockAuditLog(): void {
  resetAuditLog();
}

export default auditServiceMock;
