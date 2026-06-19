import { apiClient } from '@/utils/apiClient';
import type { BorrowerIdType } from '@/constants/borrower-registration';
import type {
  BorrowerDetail,
  BorrowerFullProfile,
  BorrowerSummary,
  OfficerRegistrationSummary,
  PendingApplicationSummary,
} from '@/types/borrower';
import type {
  ActiveLoanCheckResult,
  BlacklistCheckResult,
  IdCheckResult,
  PhoneCheckResult,
  RegistrationConflictInput,
  SimilarNameCheckResult,
} from '@/types/borrower-conflicts';
import type {
  BlacklistBorrowerInput,
  BorrowerReviewDetail,
  RejectBorrowerInput,
  ReviewedApplicationSummary,
} from '@/types/approval';
import type { RegisterBorrowerPayload } from '@/types/borrower-registration';
import type { IBorrowerService } from '@/types/services';

function buildQuery(path: string, params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `${path}?${searchParams.toString()}`;
}

const borrowerService: IBorrowerService = {
  listBorrowers(): Promise<BorrowerSummary[]> {
    return apiClient.get<BorrowerSummary[]>('/borrowers');
  },

  listMyRegistrations(officerId: string): Promise<OfficerRegistrationSummary[]> {
    return apiClient.get<OfficerRegistrationSummary[]>(
      buildQuery('/borrowers/my-registrations', { officerId }),
    );
  },

  listPendingApplications(): Promise<PendingApplicationSummary[]> {
    return apiClient.get<PendingApplicationSummary[]>(
      buildQuery('/borrowers', { status: 'PENDING' }),
    );
  },

  listReviewedApplications(approverId: string): Promise<ReviewedApplicationSummary[]> {
    return apiClient.get<ReviewedApplicationSummary[]>(
      buildQuery('/borrowers/reviewed', { approverId }),
    );
  },

  getBorrower(id: string): Promise<BorrowerDetail> {
    return apiClient.get<BorrowerDetail>(`/borrowers/${id}`);
  },

  getBorrowerFullProfile(id: string): Promise<BorrowerFullProfile> {
    return apiClient.get<BorrowerFullProfile>(`/borrowers/${id}/full-profile`);
  },

  getBorrowerReview(id: string): Promise<BorrowerReviewDetail> {
    return apiClient.get<BorrowerReviewDetail>(`/borrowers/${id}/review`);
  },

  approveBorrower(id: string): Promise<BorrowerSummary> {
    return apiClient.patch<BorrowerSummary>(`/borrowers/${id}/approve`, {});
  },

  rejectBorrower(id: string, input: RejectBorrowerInput): Promise<BorrowerSummary> {
    return apiClient.patch<BorrowerSummary>(`/borrowers/${id}/reject`, input);
  },

  blacklistBorrower(id: string, input: BlacklistBorrowerInput): Promise<BorrowerSummary> {
    return apiClient.patch<BorrowerSummary>(`/borrowers/${id}/blacklist`, input);
  },

  registerBorrower(payload: RegisterBorrowerPayload): Promise<BorrowerSummary> {
    return apiClient.post<BorrowerSummary>('/borrowers', payload);
  },

  deleteRegistration(id: string, officerId: string): Promise<void> {
    return apiClient.delete<void>(
      buildQuery(`/borrowers/${id}/registration`, { officerId }),
    );
  },

  checkPhone(phone: string): Promise<PhoneCheckResult> {
    return apiClient.get<PhoneCheckResult>(buildQuery('/borrowers/check-phone', { phone }));
  },

  checkId(idType: BorrowerIdType, idNumber: string): Promise<IdCheckResult> {
    return apiClient.get<IdCheckResult>(
      buildQuery('/borrowers/check-id', { idType, idNumber }),
    );
  },

  checkName(fullName: string): Promise<SimilarNameCheckResult> {
    return apiClient.get<SimilarNameCheckResult>(
      buildQuery('/borrowers/check-name', { fullName }),
    );
  },

  checkActiveLoan(phone: string): Promise<ActiveLoanCheckResult> {
    return apiClient.get<ActiveLoanCheckResult>(
      buildQuery('/borrowers/check-active-loan', { phone }),
    );
  },

  checkBlacklist(input: RegistrationConflictInput): Promise<BlacklistCheckResult> {
    const params: Record<string, string> = {};

    if (input.phone) {
      params.phone = input.phone;
    }

    if (input.idType) {
      params.idType = input.idType;
    }

    if (input.idNumber) {
      params.idNumber = input.idNumber;
    }

    return apiClient.get<BlacklistCheckResult>(buildQuery('/borrowers/check-blacklist', params));
  },

  checkGuarantorEligibility(input) {
    return apiClient.post<import('@/types/guarantor-eligibility').GuarantorEligibilityResult>(
      '/borrowers/check-guarantor-eligibility',
      input,
    );
  },
};

export default borrowerService;
