import { apiClient } from '@/utils/apiClient';
import { financialMutation } from '@/utils/financialMutation';
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
import type {
  LoanScheduleChangeRecord,
  ScheduleChangeDecisionResult,
} from '@/types/enterprise';

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

  async createLoan(input: CreateLoanInput): Promise<LoanDetail> {
    const { result } = await financialMutation(
      (headers) => apiClient.post<LoanDetail>('/loans', input, { headers }),
      { domain: 'loan_create' },
    );
    return result;
  },

  approveLoan(loanId: string): Promise<LoanDetail> {
    return apiClient.patch<LoanDetail>(`/loans/${loanId}/approve`, {});
  },

  rejectLoan(loanId: string, input: RejectLoanInput): Promise<LoanDetail> {
    return apiClient.patch<LoanDetail>(`/loans/${loanId}/reject`, input);
  },

  async disburseLoan(loanId: string): Promise<LoanDetail> {
    const { result } = await financialMutation(
      (headers) => apiClient.post<LoanDetail>(`/loans/${loanId}/disburse`, {}, { headers }),
      { domain: 'disbursement' },
    );
    return result;
  },

  getDisbursementEligibility(borrowerId: string): Promise<DisbursementEligibility> {
    return apiClient.get<DisbursementEligibility>(`/borrowers/${borrowerId}/disbursement-eligibility`);
  },

  requestScheduleChange(loanId, input) {
    return apiClient.post(`/loans/${loanId}/schedule-change`, input);
  },

  listPendingScheduleChanges(): Promise<LoanScheduleChangeRecord[]> {
    return apiClient.get<LoanScheduleChangeRecord[]>('/loan-schedule-changes/pending');
  },

  reviewScheduleChange(changeId: string, note?: string): Promise<ScheduleChangeDecisionResult> {
    return apiClient.post<ScheduleChangeDecisionResult>(
      `/loan-schedule-changes/${changeId}/review`,
      note?.trim() ? { note: note.trim() } : {},
    );
  },

  approveScheduleChange(changeId: string, note?: string): Promise<ScheduleChangeDecisionResult> {
    return apiClient.post<ScheduleChangeDecisionResult>(
      `/loan-schedule-changes/${changeId}/approve`,
      note?.trim() ? { note: note.trim() } : {},
    );
  },

  rejectScheduleChange(changeId: string, note?: string): Promise<ScheduleChangeDecisionResult> {
    return apiClient.post<ScheduleChangeDecisionResult>(
      `/loan-schedule-changes/${changeId}/reject`,
      note?.trim() ? { note: note.trim() } : {},
    );
  },

  previewScheduleChange(loanId, input) {
    return apiClient.post<import('@/types/enterprise').ScheduleChangePreviewResult>(
      `/loans/${loanId}/schedule-change/preview`,
      input,
    );
  },

  getPendingScheduleChangeForLoan(loanId: string) {
    return apiClient.get<LoanScheduleChangeRecord | null>(
      `/loans/${loanId}/schedule-changes/pending`,
    );
  },
};

export default loanService;
