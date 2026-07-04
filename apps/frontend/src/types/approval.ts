import type { BorrowerDetail } from '@/types/borrower';
import type { BorrowerIdType } from '@/constants/borrower-registration';
import type { BorrowerGender } from '@/constants/borrower-registration';

export type ApprovalDecisionAction = 'approve' | 'reject' | 'blacklist';

export interface RejectBorrowerInput {
  reason: string;
}

export interface BlacklistBorrowerInput {
  reason: string;
}

export interface BorrowerReviewDetail extends BorrowerDetail {
  dateOfBirth: string;
  gender: BorrowerGender;
  email?: string;
  nationality: string;
  idType: BorrowerIdType;
  idNumber: string;
  houseAddress: string;
  gpsAddress: string;
  city: string;
  region: string;
  district: string;
  businessName: string;
  businessAddress: string;
  typeOfWork: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  photoFileName: string;
  photoMimeType: string;
  photoUrl?: string | null;
  guarantorPhotoUrl?: string | null;
  registeredByOfficerName: string;
  registeredByOfficerId?: string;
}

export type ReviewedDecision = 'APPROVED' | 'REJECTED' | 'BLACKLISTED';

export interface ReviewedApplicationSummary {
  borrowerId: string;
  borrowerName: string;
  community: string;
  decision: ReviewedDecision;
  reason?: string;
  reviewedAt: string;
}
