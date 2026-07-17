import type {
  AssignLoanPoolMembershipInput,
  CreateLoanPoolInput,
  LoanPoolDetail,
  LoanPoolGroupOption,
  LoanPoolListResponse,
} from '@/types/loan-pool';
import type { ILoanPoolService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const loanPoolService: ILoanPoolService = {
  listLoanPools(): Promise<LoanPoolListResponse> {
    return apiClient.get<LoanPoolListResponse>('/loan-pools');
  },

  getLoanPool(id: string): Promise<LoanPoolDetail> {
    return apiClient.get<LoanPoolDetail>(`/loan-pools/${id}`);
  },

  createLoanPool(input: CreateLoanPoolInput): Promise<LoanPoolDetail> {
    return apiClient.post<LoanPoolDetail>('/loan-pools', input);
  },

  listUnassignedGroups(): Promise<LoanPoolGroupOption[]> {
    return apiClient.get<LoanPoolGroupOption[]>('/loan-pools/unassigned-groups');
  },

  assignGroupMembership(
    poolId: string,
    input: AssignLoanPoolMembershipInput,
  ): Promise<LoanPoolDetail> {
    return apiClient.post<LoanPoolDetail>(`/loan-pools/${poolId}/memberships`, input);
  },
};

export default loanPoolService;
