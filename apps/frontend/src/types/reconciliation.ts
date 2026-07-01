export interface SubmitReconciliationInput {
  collectorId: string;
  date: string;
  physicalCashPesewas: number;
  comment?: string;
}

export interface ReconciliationSubmission {
  collectorId: string;
  date: string;
  expectedPesewas: number;
  actualPesewas: number;
  physicalCashPesewas: number;
  variancePesewas: number;
  varianceFlagged: boolean;
  submittedAt: string;
}

export interface ReconciliationHistoryEntry {
  id: string;
  reconciliationId: string;
  eventType: string;
  actorUserId: string;
  beforeSnapshot?: unknown;
  afterSnapshot: unknown;
  reason?: string | null;
  createdAt: string;
}
