export interface OrganizationHoliday {
  id: string;
  name: string;
  holidayDate: string;
  scope: string;
  branch: string | null;
  source?: string;
  enabled?: boolean;
  year?: number | null;
  externalKey?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrganizationHolidayInput {
  name: string;
  holidayDate: string;
  scope?: string;
  branch?: string | null;
}

export interface RelocateBorrowerInput {
  community: string;
  district?: string;
  constituency?: string;
  collectorUserId?: string | null;
  reason: string;
}

export interface DissolveGroupInput {
  groupId: string;
  reason: string;
  allowWithOutstanding?: boolean;
}

export interface ReplaceGroupMemberInput {
  groupId: string;
  outgoingBorrowerId: string;
  incomingBorrowerId: string;
  reason: string;
  autoApprove?: boolean;
}

export interface RequestScheduleChangeInput {
  loanId: string;
  toPaymentDay: string;
  effectiveFrom: string;
  reason: string;
}

export interface LoanScheduleChangeRecord {
  id: string;
  loanId: string;
  borrowerId: string;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED';
  fromPaymentDay: string;
  toPaymentDay: string;
  effectiveFrom: string;
  reason: string;
  requestedByUserId: string;
  reviewedByUserId?: string | null;
  approvedByUserId?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleChangeDecisionResult {
  id: string;
  status: 'REVIEWED' | 'APPROVED';
  recalculatedWeeks?: number;
  nextDueDate?: string | null;
}

export interface ForceLogoutResult {
  ok: true;
  userId: string;
}

export interface LoginHistoryEvent {
  id: string;
  userId?: string | null;
  email?: string;
  success?: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface WriteOffReportRow {
  id: string;
  loanId?: string;
  borrowerId?: string;
  amountPesewas: number;
  status: string;
  reason?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface WriteOffReport {
  generatedAt: string;
  summary: {
    totalWriteOffs: number;
    approvedCount: number;
    pendingCount: number;
    totalWrittenOffPesewas: number;
  };
  rows: WriteOffReportRow[];
}

export type AgingBucket = 'current' | 'days1to7' | 'days8to30' | 'days31plus';

export interface AgingAnalysisRow {
  loanId: string;
  borrowerId: string;
  outstandingPesewas: number;
  daysPastDue: number;
  bucket: AgingBucket;
}

export interface AgingAnalysisReport {
  generatedAt: string;
  summary: {
    current: number;
    days1to7: number;
    days8to30: number;
    days31plus: number;
  };
  rows: AgingAnalysisRow[];
}
