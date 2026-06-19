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
  calculatePhysicalCashVariance,
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
    };
  }

  return {
    collectorId,
    date,
    expectedPesewas,
    actualPesewas,
    variancePesewas: 0,
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
    const variancePesewas = calculatePhysicalCashVariance(
      input.physicalCashPesewas,
      actualPesewas,
    );
    const varianceFlagged = isVarianceAboveThreshold(variancePesewas, expectedPesewas);
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
        ? `Variance ${variancePesewas} pesewas exceeds threshold`
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
};

export function resetMockReconciliationSubmissions(): void {
  resetReconciliationSubmissions();
}

export default reconciliationServiceMock;
