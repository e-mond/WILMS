import type { CollectorDashboard } from '@/types/collector-dashboard';
import type { ICollectorService } from '@/types/services';
import { assembleCollectorDashboard } from '@/services/mock/collector-dashboard.builder';
import {
  buildAllCollectorBorrowerRows,
} from '@/features/payment-collection/collector-dashboard.utils';
import { loadCollectorBookInputs, loadCollectorDashboardInputs } from '@/services/mock/collector-dashboard-inputs';
import reconciliationServiceMock from '@/services/mock/reconciliationService.mock';
import { simulateDelay } from '@/services/mock/delay';
import { localIsoDate } from '@/utils/weekday';

const collectorServiceMock: ICollectorService = {
  async getDashboard(collectorId: string, date?: string): Promise<CollectorDashboard> {
    await simulateDelay();

    const referenceDate = date ?? localIsoDate();
    const { loans, payments } = await loadCollectorDashboardInputs(referenceDate);
    const reconciliation = await reconciliationServiceMock.getCollectorReconciliation(
      collectorId,
      referenceDate,
    );

    return assembleCollectorDashboard({
      referenceDate,
      collectorId,
      loans,
      payments,
      reconciliation,
    });
  },

  async listAssignedBorrowers(collectorId: string, date?: string) {
    await simulateDelay();

    const referenceDate = date ?? localIsoDate();
    const { loans, payments } = await loadCollectorBookInputs(referenceDate);
    const reconciliation = await reconciliationServiceMock.getCollectorReconciliation(
      collectorId,
      referenceDate,
    );

    return buildAllCollectorBorrowerRows({
      referenceDate,
      collectorId,
      loans,
      payments,
      reconciliation,
    });
  },
};

export default collectorServiceMock;
