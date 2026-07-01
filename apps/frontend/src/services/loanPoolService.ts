import type { CreateLoanPoolInput, LoanPoolDetail, LoanPoolListResponse } from '@/types/loan-pool';
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
};

export default loanPoolService;
