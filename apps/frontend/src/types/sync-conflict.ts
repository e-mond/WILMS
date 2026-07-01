export interface SyncConflict {
  id: string;
  operationId: string;
  conflictReason: string;
  status: string;
  resolutionNote?: string | null;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface SyncConflictListResponse {
  conflicts: SyncConflict[];
}

export interface ResolveSyncConflictInput {
  note?: string;
}
