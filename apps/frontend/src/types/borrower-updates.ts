export const BORROWER_UPDATE_FIELDS = [
  'PHONE',
  'ALTERNATE_PHONE',
  'NAME',
  'ADDRESS',
  'COMMUNITY',
  'CITY',
  'BUSINESS_ADDRESS',
  'GUARANTOR_PHONE',
  'GUARANTOR_NAME',
] as const;

export type BorrowerUpdateField = (typeof BORROWER_UPDATE_FIELDS)[number];

export type BorrowerUpdateStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface BorrowerUpdateRequest {
  id: string;
  borrowerId: string;
  field: BorrowerUpdateField;
  beforeValue: string;
  afterValue: string;
  reason: string;
  status: BorrowerUpdateStatus;
  requestedByUserId: string;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const BORROWER_UPDATE_FIELD_LABELS: Record<BorrowerUpdateField, string> = {
  PHONE: 'Phone number',
  ALTERNATE_PHONE: 'Alternate phone',
  NAME: 'Name correction',
  ADDRESS: 'Home address',
  COMMUNITY: 'Community',
  CITY: 'City / town',
  BUSINESS_ADDRESS: 'Business address',
  GUARANTOR_PHONE: 'Guarantor phone',
  GUARANTOR_NAME: 'Guarantor name',
};
