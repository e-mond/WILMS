import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import {
  ADJUSTMENT_STATUS,
  ADJUSTMENT_TYPE,
  type AdjustmentListResponse,
  type AdjustmentRequest,
  type CreateAdjustmentInput,
  type RejectAdjustmentInput,
} from '@/types/adjustment';
import { BORROWER_STATUS } from '@/types/borrower';
import { LOAN_STATUS } from '@/types/loan';
import type { IAdjustmentService } from '@/types/services';
import { SYSTEM_SUPER_ADMIN_ACTOR_ID } from '@/constants/system-actors';
import { TRANSACTION_TYPE } from '@/types/transaction';
import auditServiceMock from '@/services/mock/auditService.mock';
import { updateBorrowerRegistryStatus } from '@/services/mock/borrower-registry.store';
import { simulateDelay } from '@/services/mock/delay';
import { appendFinancialTransaction } from '@/services/mock/transaction-log.store';
import {
  appendAdjustmentRequest,
  getAdjustmentRequest,
  getAdjustmentRequests,
  resetAdjustmentRequests,
  updateAdjustmentStatus,
} from '@/services/mock/adjustment.store';

function assertPendingAdjustment(id: string): AdjustmentRequest {
  const request = getAdjustmentRequest(id);

  if (!request) {
    throw new ApiError('Adjustment request not found.', API_ERROR_CODE.NOT_FOUND, 404);
  }

  if (request.status !== ADJUSTMENT_STATUS.PENDING) {
    throw new ApiError(
      'Only pending adjustments can be reviewed.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  return request;
}

function assertRejectReason(reason: string | undefined): void {
  if (!reason?.trim()) {
    throw new ApiError(
      'A reason is required to reject this adjustment.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }
}

function assertCreateAdjustmentInput(input: CreateAdjustmentInput): CreateAdjustmentInput {
  const reason = input.reason.trim();

  if (reason.length < 10) {
    throw new ApiError(
      'Provide at least 10 characters explaining the adjustment.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  if (!input.borrowerId.trim() || !input.borrowerName.trim()) {
    throw new ApiError('Borrower details are required.', API_ERROR_CODE.VALIDATION, 422);
  }

  if (!Number.isFinite(input.amountPesewas) || input.amountPesewas <= 0) {
    throw new ApiError('A valid adjustment amount is required.', API_ERROR_CODE.VALIDATION, 422);
  }

  return { ...input, reason };
}

async function applyApprovedAdjustment(request: AdjustmentRequest): Promise<void> {
  appendFinancialTransaction({
    type: TRANSACTION_TYPE.ADJUSTMENT,
    borrowerId: request.borrowerId,
    loanId: request.loanId,
    amountPesewas: request.amountPesewas,
    collectorId: SYSTEM_SUPER_ADMIN_ACTOR_ID,
    recordedAt: new Date().toISOString(),
  });

  if (request.type === ADJUSTMENT_TYPE.WRITE_OFF) {
    updateBorrowerRegistryStatus(request.borrowerId, BORROWER_STATUS.BLACKLISTED);

    if (request.loanId) {
      const loanModule = await import('@/services/mock/loanService.mock');
      loanModule.updateLoanStatusInMock(request.loanId, LOAN_STATUS.WRITTEN_OFF);
    }
  }
}

const adjustmentServiceMock: IAdjustmentService = {
  async listPendingAdjustments(): Promise<AdjustmentListResponse> {
    await simulateDelay();

    const requests = getAdjustmentRequests().filter(
      (request) => request.status === ADJUSTMENT_STATUS.PENDING,
    );

    return {
      generatedAt: new Date().toISOString(),
      pendingCount: requests.length,
      requests,
    };
  },

  async createAdjustment(
    input: CreateAdjustmentInput,
    actorId: string,
    actorDisplayName: string,
  ) {
    await simulateDelay();
    const validated = assertCreateAdjustmentInput(input);
    const created = appendAdjustmentRequest(
      validated,
      actorDisplayName,
      new Date().toISOString(),
    );

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.ADJUSTMENT_REQUESTED,
      actorId,
      actorDisplayName,
      targetEntityId: created.id,
      targetEntityType: AUDIT_TARGET_ENTITY.ADJUSTMENT,
      reason: validated.reason,
    });

    return created;
  },

  async approveAdjustment(id: string, actorId: string, actorDisplayName: string) {
    await simulateDelay();
    const request = assertPendingAdjustment(id);
    await applyApprovedAdjustment(request);
    const updated = updateAdjustmentStatus(id, ADJUSTMENT_STATUS.APPROVED);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.ADJUSTMENT_APPROVED,
      actorId,
      actorDisplayName,
      targetEntityId: id,
      targetEntityType: AUDIT_TARGET_ENTITY.ADJUSTMENT,
      reason: request.reason,
    });

    return updated;
  },

  async rejectAdjustment(
    id: string,
    input: RejectAdjustmentInput,
    actorId: string,
    actorDisplayName: string,
  ) {
    await simulateDelay();
    assertPendingAdjustment(id);
    assertRejectReason(input.reason);
    const updated = updateAdjustmentStatus(id, ADJUSTMENT_STATUS.REJECTED);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.ADJUSTMENT_REJECTED,
      actorId,
      actorDisplayName,
      targetEntityId: id,
      targetEntityType: AUDIT_TARGET_ENTITY.ADJUSTMENT,
      reason: input.reason.trim(),
    });

    return updated;
  },
};

export function resetMockAdjustments(): void {
  resetAdjustmentRequests();
}

export default adjustmentServiceMock;
