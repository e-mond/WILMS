import { MOCK_ADJUSTMENT_REQUESTS } from '@/mocks/adjustments';
import {
  ADJUSTMENT_STATUS,
  type AdjustmentRequest,
  type AdjustmentStatus,
  type CreateAdjustmentInput,
} from '@/types/adjustment';

let adjustmentRequests: AdjustmentRequest[] = [...MOCK_ADJUSTMENT_REQUESTS];

export function getAdjustmentRequests(): AdjustmentRequest[] {
  return adjustmentRequests;
}

export function getAdjustmentRequest(id: string): AdjustmentRequest | undefined {
  return adjustmentRequests.find((request) => request.id === id);
}

export function updateAdjustmentStatus(
  id: string,
  status: AdjustmentStatus,
): AdjustmentRequest {
  const existing = adjustmentRequests.find((request) => request.id === id);

  if (!existing) {
    throw new Error('Adjustment request not found.');
  }

  const updated: AdjustmentRequest = { ...existing, status };
  adjustmentRequests = adjustmentRequests.map((request) =>
    request.id === id ? updated : request,
  );
  return updated;
}

function nextAdjustmentId(): string {
  const numericIds = adjustmentRequests
    .map((request) => Number.parseInt(request.id.replace('adj-', ''), 10))
    .filter((value) => !Number.isNaN(value));
  const next = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

  return `adj-${String(next).padStart(3, '0')}`;
}

export function appendAdjustmentRequest(
  input: CreateAdjustmentInput,
  requestedBy: string,
  requestedAt: string,
): AdjustmentRequest {
  const request: AdjustmentRequest = {
    id: nextAdjustmentId(),
    ...input,
    requestedBy,
    requestedAt,
    status: ADJUSTMENT_STATUS.PENDING,
  };

  adjustmentRequests = [...adjustmentRequests, request];
  return request;
}

export function resetAdjustmentRequests(): void {
  adjustmentRequests = [...MOCK_ADJUSTMENT_REQUESTS];
}
