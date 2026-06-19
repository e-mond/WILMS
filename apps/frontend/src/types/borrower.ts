export { BORROWER_STATUS, type BorrowerStatus } from '@wilms/shared-contracts';

import type { BorrowerStatus } from '@wilms/shared-contracts';
import type { RegistrationWorkflowStatus } from '@/constants/registration-workflow';

export interface BorrowerSummary {
  id: string;
  fullName: string;
  phone: string;
  status: BorrowerStatus;
  groupName: string;
  groupId?: string;
  photoUrl?: string | null;
}

export interface BorrowerDetail extends BorrowerSummary {
  groupId: string;
  nationalId: string;
  community: string;
  registeredAt: string;
  alternativePhone?: string;
  email?: string;
  gpsAddress?: string;
  houseAddress?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  businessName?: string;
  typeOfWork?: string;
}

export interface BorrowerRiskSummary {
  riskRating: string;
  missedPaymentCount: number;
  defaultStatus: string;
  blacklistStatus: string;
  flags: string[];
  notes: string[];
}

export interface BorrowerFullProfile extends BorrowerDetail {
  idType?: string;
  city?: string;
  region?: string;
  district?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  risk: BorrowerRiskSummary;
}

export interface OfficerRegistrationSummary {
  id: string;
  fullName: string;
  phone: string;
  status: BorrowerStatus;
  registrationStatus: RegistrationWorkflowStatus;
  community: string;
  registeredAt: string;
  canEdit: boolean;
  canDelete: boolean;
  photoUrl?: string | null;
}

export interface PendingApplicationSummary {
  id: string;
  fullName: string;
  phone: string;
  community: string;
  registeredAt: string;
  registeredByOfficerName: string;
}
