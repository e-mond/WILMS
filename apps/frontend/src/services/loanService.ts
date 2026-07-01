import { apiClient } from '@/utils/apiClient';
import type {
  BorrowerLoanHistoryEntry,
  CreateLoanInput,
  LoanDetail,
  LoanEligibleBorrower,
  LoanPaymentLogEntry,
  LoanPortfolioEntry,
  LoanProgressSummary,
  LoanSummary,
  RejectLoanInput,
} from '@/types/loan';
import type { LoanSchedule } from '@/types/loan-schedule';
import type { ILoanService } from '@/types/services';
import type { DisbursementEligibility } from '@/types/transaction';

const loanService: ILoanService = {
  listLoans(): Promise<LoanSummary[]> {
    return apiClient.get<LoanSummary[]>('/loans');
  },

  listPortfolioEntries(): Promise<LoanPortfolioEntry[]> {
    return apiClient.get<LoanPortfolioEntry[]>('/loans/portfolio');
  },

  listActiveLoans(): Promise<LoanSummary[]> {
    return apiClient.get<LoanSummary[]>('/loans?status=ACTIVE');
  },

  listEligibleBorrowers(): Promise<LoanEligibleBorrower[]> {
    return apiClient.get<LoanEligibleBorrower[]>('/borrowers/loan-eligible');
  },

  getLoan(id: string): Promise<LoanDetail> {
    return apiClient.get<LoanDetail>(`/loans/${id}`);
  },

  getLoanSchedule(loanId: string): Promise<LoanSchedule> {
    return apiClient.get<LoanSchedule>(`/loans/${loanId}/schedule`);
  },

  listBorrowerLoans(borrowerId: string): Promise<BorrowerLoanHistoryEntry[]> {
    return apiClient.get<BorrowerLoanHistoryEntry[]>(`/borrowers/${borrowerId}/loans`);
  },

  getLoanProgress(loanId: string): Promise<LoanProgressSummary> {
    return apiClient.get<LoanProgressSummary>(`/loans/${loanId}/progress`);
  },

  listLoanPaymentLog(loanId: string): Promise<LoanPaymentLogEntry[]> {
    return apiClient.get<LoanPaymentLogEntry[]>(`/loans/${loanId}/payments`);
  },

  createLoan(input: CreateLoanInput): Promise<LoanDetail> {
    return apiClient.post<LoanDetail>('/loans', input);
  },

  approveLoan(loanId: string): Promise<LoanDetail> {
    return apiClient.patch<LoanDetail>(`/loans/${loanId}/approve`, {});
  },

  rejectLoan(loanId: string, input: RejectLoanInput): Promise<LoanDetail> {
    return apiClient.patch<LoanDetail>(`/loans/${loanId}/reject`, input);
  },

  disburseLoan(loanId: string): Promise<LoanDetail> {
    return apiClient.post<LoanDetail>(`/loans/${loanId}/disburse`, {});
  },

  getDisbursementEligibility(borrowerId: string): Promise<DisbursementEligibility> {
    return apiClient.get<DisbursementEligibility>(`/borrowers/${borrowerId}/disbursement-eligibility`);
  },
};

export default loanService;
