import { RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH } from '@/constants/reconciliation';
import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import { loadCollectorDashboardInputs } from '@/services/mock/collector-dashboard-inputs';
import auditServiceMock from '@/services/mock/auditService.mock';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import {
  getReconciliationSubmission,
  resetReconciliationSubmissions,
  saveReconciliationSubmission,
} from '@/services/mock/reconciliation.store';
import { simulateDelay } from '@/services/mock/delay';
import type { SubmitReconciliationInput } from '@/types/reconciliation';
import type { IReconciliationService, ReconciliationSummary } from '@/types/services';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import {
  buildReconciliationTotals,
  calculatePrimaryVariancePesewas,
  isVarianceAboveThreshold,
} from '@/utils/reconciliation-summary';

async function buildReconciliationSummary(
  collectorId: string,
  date: string,
): Promise<ReconciliationSummary> {
  const { loans, payments } = await loadCollectorDashboardInputs(date);
  const { expectedPesewas, actualPesewas } = buildReconciliationTotals(
    collectorId,
    date,
    loans,
    payments,
  );
  const submission = getReconciliationSubmission(collectorId, date);

  if (submission) {
    return {
      collectorId,
      date,
      expectedPesewas,
      actualPesewas,
      physicalCashPesewas: submission.physicalCashPesewas,
      variancePesewas: submission.variancePesewas,
      varianceFlagged: submission.varianceFlagged,
      submitted: true,
      submittedAt: submission.submittedAt,
      status: submission.varianceFlagged ? 'PENDING_REVIEW' : 'APPROVED',
    };
  }

  return {
    collectorId,
    date,
    expectedPesewas,
    actualPesewas,
    variancePesewas: actualPesewas - expectedPesewas,
    submitted: false,
  };
}

const reconciliationServiceMock: IReconciliationService = {
  async getCollectorReconciliation(collectorId: string, date: string): Promise<ReconciliationSummary> {
    await simulateDelay();
    return buildReconciliationSummary(collectorId, date);
  },

  async submitReconciliation(input: SubmitReconciliationInput): Promise<ReconciliationSummary> {
    await simulateDelay();

    const existing = getReconciliationSubmission(input.collectorId, input.date);

    if (existing) {
      throw new ApiError(
        'Reconciliation already submitted for this date.',
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    const { loans, payments } = await loadCollectorDashboardInputs(input.date);
    const { expectedPesewas, actualPesewas } = buildReconciliationTotals(
      input.collectorId,
      input.date,
      loans,
      payments,
    );
    const variancePesewas = calculatePrimaryVariancePesewas(
      input.physicalCashPesewas,
      expectedPesewas,
    );
    const varianceFlagged = isVarianceAboveThreshold(variancePesewas, expectedPesewas);

    if (varianceFlagged) {
      const comment = input.comment?.trim() ?? '';
      if (comment.length < RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH) {
        throw new ApiError(
          `A comment of at least ${RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH} characters is required when variance is flagged.`,
          API_ERROR_CODE.VALIDATION,
          422,
        );
      }
    }

    const submittedAt = new Date().toISOString();

    saveReconciliationSubmission({
      collectorId: input.collectorId,
      date: input.date,
      expectedPesewas,
      actualPesewas,
      physicalCashPesewas: input.physicalCashPesewas,
      variancePesewas,
      varianceFlagged,
      submittedAt,
    });

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.RECONCILIATION_SUBMITTED,
      actorId: input.collectorId,
      targetEntityId: `${input.collectorId}:${input.date}`,
      targetEntityType: AUDIT_TARGET_ENTITY.RECONCILIATION,
      reason: varianceFlagged
        ? input.comment?.trim() ?? `Variance ${variancePesewas} pesewas exceeds threshold`
        : undefined,
    });

    if (varianceFlagged) {
      await notificationServiceMock.sendSupervisorAlert({
        message: `Reconciliation variance on ${input.date} requires Super Admin review.`,
        collectorId: input.collectorId,
        paymentId: `reconciliation-${input.collectorId}-${input.date}`,
      });
    }

    return buildReconciliationSummary(input.collectorId, input.date);
  },

  async listReconciliations() {
    await simulateDelay();
    return [];
  },

  async getReconciliation(id: string) {
    await simulateDelay();
    void id;
    return {
      collectorId: 'collector-001',
      date: new Date().toISOString().slice(0, 10),
      expectedPesewas: 0,
      actualPesewas: 0,
      variancePesewas: 0,
      submitted: false,
    };
  },

  async getReconciliationHistory() {
    await simulateDelay();
    return [];
  },

  async reviewReconciliation(id: string, input) {
    await simulateDelay();
    void id;
    return {
      collectorId: 'collector-001',
      date: new Date().toISOString().slice(0, 10),
      expectedPesewas: 10000,
      actualPesewas: 9000,
      variancePesewas: -1000,
      submitted: true,
      status: input.status,
      resolutionNotes: input.resolutionNotes,
    };
  },
};

export function resetMockReconciliationSubmissions(): void {
  resetReconciliationSubmissions();
}

export default reconciliationServiceMock;
