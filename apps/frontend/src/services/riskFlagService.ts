import type {
  AssignRiskFlagInput,
  CreateRiskFlagInput,
  ResolveRiskFlagInput,
  RiskFlagDetail,
  RiskFlagListResponse,
} from '@/types/risk-flag';
import type { IRiskFlagService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const riskFlagService: IRiskFlagService = {
  listRiskFlags(): Promise<RiskFlagListResponse> {
    return apiClient.get<RiskFlagListResponse>('/risk-flags');
  },

  getRiskFlag(id: string): Promise<RiskFlagDetail> {
    return apiClient.get<RiskFlagDetail>(`/risk-flags/${id}`);
  },

  createRiskFlag(input: CreateRiskFlagInput): Promise<RiskFlagDetail> {
    return apiClient.post<RiskFlagDetail>('/risk-flags', input);
  },

  escalateRiskFlag(id: string): Promise<RiskFlagDetail> {
    return apiClient.patch<RiskFlagDetail>(`/risk-flags/${id}/escalate`, {});
  },

  resolveRiskFlag(id: string, input?: ResolveRiskFlagInput): Promise<RiskFlagDetail> {
    return apiClient.patch<RiskFlagDetail>(`/risk-flags/${id}/resolve`, input ?? {});
  },

  assignRiskFlag(id: string, input: AssignRiskFlagInput): Promise<RiskFlagDetail> {
    return apiClient.patch<RiskFlagDetail>(`/risk-flags/${id}/assign`, input);
  },
};

export default riskFlagService;
