export type HolidayRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'APPLIED';

export interface HolidayRequest {
  id: string;
  name: string;
  holidayDate: string;
  endDate: string | null;
  reason: string | null;
  notes: string | null;
  evidenceUrl: string | null;
  community: string | null;
  groupId: string | null;
  borrowerId: string | null;
  scope: string;
  branch: string | null;
  status: HolidayRequestStatus;
  requestedByUserId: string;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  organizationHolidayId: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayRequestInput {
  name: string;
  holidayDate: string;
  endDate?: string | null;
  reason?: string | null;
  notes?: string | null;
  evidenceUrl?: string | null;
  community?: string | null;
  groupId?: string | null;
  borrowerId?: string | null;
  scope?: string;
  branch?: string | null;
  submit?: boolean;
}

export interface HolidayImpactPreview {
  holidayDate: string;
  endDate: string | null;
  affectedInstallments: number;
  sampleShifts: Array<{
    loanId: string;
    weekNumber: number;
    originalDueDate: string;
    shiftedDueDate: string;
  }>;
}
