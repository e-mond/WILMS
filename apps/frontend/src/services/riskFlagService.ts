import type { RiskFlagDetail, RiskFlagListResponse } from '@/types/risk-flag';
import type { IRiskFlagService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const riskFlagService: IRiskFlagService = {
  listRiskFlags(): Promise<RiskFlagListResponse> {
    return apiClient.get<RiskFlagListResponse>('/risk-flags');
  },

  getRiskFlag(id: string): Promise<RiskFlagDetail> {
    return apiClient.get<RiskFlagDetail>(`/risk-flags/${id}`);
  },
};

export default riskFlagService;
