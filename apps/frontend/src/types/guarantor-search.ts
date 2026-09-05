import type { GuarantorEligibilityResult } from '@/types/guarantor-eligibility';

export interface GuarantorSearchHit {
  kind: 'borrower' | 'guarantor';
  key: string;
  name: string;
  phone: string;
  phoneDisplay: string;
  displayId?: string;
  community?: string;
  groupName?: string;
  activeGuaranteeCount: number;
  maxGuarantees: number;
  isEligiblePreview: boolean;
  isGroupLeader?: boolean;
  isBlacklisted?: boolean;
}

export interface GuarantorLookupResult {
  name: string;
  phone: string;
  phoneDisplay: string;
  displayId?: string;
  community?: string;
  groupName?: string;
  idType?: string;
  idNumber?: string;
  photoUploadId?: string;
  photoUrl?: string | null;
  borrowerId?: string;
  isGroupLeader: boolean;
  isBlacklisted: boolean;
  eligibility: GuarantorEligibilityResult;
  guaranteedBorrowers: Array<{
    displayId: string;
    fullName: string;
    community: string;
    status: string;
  }>;
}
