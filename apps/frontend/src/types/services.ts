import type { AuditAction, AuditTargetEntity } from '@/constants/audit';
import type { BorrowerIdType } from '@/constants/borrower-registration';
import type { CreateAuditEntryInput } from '@/types/audit';
import type {
  AutoGroupCreationResult,
  GroupFormationConfig,
  GroupFormationStatus,
} from '@/types/group-formation';
import type { CurrentLocationResult, LocationCity, LocationDistrict, LocationRegion } from '@/types/location';
import type { LoginInput, LoginResult } from '@/types/auth';
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
import type { GuarantorEligibilityInput, GuarantorEligibilityResult } from '@/types/guarantor-eligibility';
import type {
  BlacklistBorrowerInput,
  BorrowerReviewDetail,
  RejectBorrowerInput,
  ReviewedApplicationSummary,
} from '@/types/approval';
import type { RegisterBorrowerPayload } from '@/types/borrower-registration';
import type {
  BorrowerLoanHistoryEntry,
  CreateLoanInput,
  LoanDetail,
  LoanEligibleBorrower,
  LoanPaymentLogEntry,
  LoanPortfolioEntry,
  LoanProgressSummary,
  LoanSummary,
} from '@/types/loan';
import type { LoanSchedule } from '@/types/loan-schedule';
import type { CollectorDashboard } from '@/types/collector-dashboard';
import type { DashboardSummary } from '@/types/dashboard';
import type {
  CollectorPerformanceReport,
  DailyCollectionReport,
  DailyCollectionReportParams,
  DefaulterReport,
  FinancialLedgerReport,
  FinancialLedgerReportParams,
  GroupRiskReport,
  LoanPortfolioReport,
  LoanPortfolioReportParams,
} from '@/types/reports';
import type { CollectorDetail, CollectorListResponse } from '@/types/collector-management';
import type { GroupDetail, GroupListResponse } from '@/types/group';
import type {
  AddGroupMemberInput,
  FlagGroupInput,
  GroupMembershipChangeInput,
  GroupMembershipChangeResult,
  RecordGroupAdjustmentInput,
  ReassignGroupCollectorInput,
  ReplaceGroupLeaderInput,
  TransferGroupMemberInput,
  UpdateGroupDisplayNameInput,
} from '@/types/group-detail';
import type { LoanPoolDetail, LoanPoolListResponse } from '@/types/loan-pool';
import type {
  AdjustmentListResponse,
  AdjustmentRequest,
  CreateAdjustmentInput,
  RejectAdjustmentInput,
} from '@/types/adjustment';
import type { NotificationDelivery, SendNotificationInput } from '@/types/notification';
import type {
  OverpaymentReview,
  OverpaymentReviewListResponse,
  QueueOverpaymentReviewInput,
  ResolveOverpaymentReviewInput,
} from '@/types/overpayment-review';
import type { SubmitReconciliationInput } from '@/types/reconciliation';
import type { ReportsHubMetadata, ReportCategory } from '@/types/reports';
import type {
  CreateSettingsUserInput,
  SettingsActivityEntry,
  SettingsMeProfile,
  SettingsUserRecord,
  SystemSettings,
  UpdateSettingsMeInput,
  UpdateSettingsUserInput,
  UpdateSystemSettingsInput,
} from '@/types/settings';
import type {
  RegistrationLegalConfig,
} from '@/types/registration-legal';
import type {
  CreateRoleInput,
  PermissionDefinition,
  RoleDefinition,
  SettingsUserProfile,
  UpdateRoleInput,
} from '@/types/user-management';
import type {
  CollectionMetricsQuery,
  CollectionMetricsResponse,
} from '@/types/collection-metrics';
import type {
  CreateExpenseInput,
  ExpenseListResponse,
  ExpenseRecord,
  ReviewExpenseInput,
} from '@/types/expense';
import type { PaymentEntryContext } from '@/types/payment-entry';
import type { EditPaymentInput, PaymentTransaction, RecordPaymentInput } from '@/types/payment';
import type { RiskFlagDetail, RiskFlagListResponse } from '@/types/risk-flag';
import type {
  AdminFeeStatus,
  AwaitingAdminFeeBorrower,
  DisbursementEligibility,
  FinancialTransaction,
  RecordAdminFeeInput,
} from '@/types/transaction';

import type {
  CreatePhotoCaptureSessionInput,
  PhotoCaptureSession,
} from '@/types/photo-capture-session';
import type { UploadFileInput, UploadRecord } from '@/types/upload';

export interface IPhotoCaptureSessionService {
  createSession(input: CreatePhotoCaptureSessionInput): Promise<PhotoCaptureSession>;
  getSession(sessionToken: string): Promise<PhotoCaptureSession | null>;
  simulatePhoneCapture(sessionToken: string, dataUrl: string): Promise<PhotoCaptureSession>;
}

export interface IUploadService {
  uploadFile(input: UploadFileInput): Promise<UploadRecord>;
  getUpload(id: string): Promise<UploadRecord | null>;
  deleteUpload(id: string): Promise<void>;
}

export interface IAuthService {
  login(input: LoginInput): Promise<LoginResult>;
}

export interface IBorrowerService {
  listBorrowers(): Promise<BorrowerSummary[]>;
  listMyRegistrations(officerId: string): Promise<OfficerRegistrationSummary[]>;
  listPendingApplications(): Promise<PendingApplicationSummary[]>;
  listReviewedApplications(approverId: string): Promise<ReviewedApplicationSummary[]>;
  getBorrower(id: string): Promise<BorrowerDetail>;
  getBorrowerFullProfile(id: string): Promise<BorrowerFullProfile>;
  getBorrowerReview(id: string): Promise<BorrowerReviewDetail>;
  approveBorrower(id: string): Promise<BorrowerSummary>;
  rejectBorrower(id: string, input: RejectBorrowerInput): Promise<BorrowerSummary>;
  blacklistBorrower(id: string, input: BlacklistBorrowerInput): Promise<BorrowerSummary>;
  registerBorrower(payload: RegisterBorrowerPayload): Promise<BorrowerSummary>;
  deleteRegistration(id: string, officerId: string): Promise<void>;
  checkPhone(phone: string): Promise<PhoneCheckResult>;
  checkId(idType: BorrowerIdType, idNumber: string): Promise<IdCheckResult>;
  checkName(fullName: string): Promise<SimilarNameCheckResult>;
  checkActiveLoan(phone: string): Promise<ActiveLoanCheckResult>;
  checkBlacklist(input: RegistrationConflictInput): Promise<BlacklistCheckResult>;
  checkGuarantorEligibility(input: GuarantorEligibilityInput): Promise<GuarantorEligibilityResult>;
}

export interface ILoanService {
  listLoans(): Promise<LoanSummary[]>;
  listPortfolioEntries(): Promise<LoanPortfolioEntry[]>;
  listActiveLoans(): Promise<LoanSummary[]>;
  listEligibleBorrowers(): Promise<LoanEligibleBorrower[]>;
  getLoan(id: string): Promise<LoanDetail>;
  getLoanSchedule(loanId: string): Promise<LoanSchedule>;
  listBorrowerLoans(borrowerId: string): Promise<BorrowerLoanHistoryEntry[]>;
  getLoanProgress(loanId: string): Promise<LoanProgressSummary>;
  listLoanPaymentLog(loanId: string): Promise<LoanPaymentLogEntry[]>;
  createLoan(input: CreateLoanInput): Promise<LoanDetail>;
  disburseLoan(loanId: string): Promise<LoanDetail>;
  getDisbursementEligibility(borrowerId: string): Promise<DisbursementEligibility>;
}

export interface ITransactionService {
  recordAdminFee(input: RecordAdminFeeInput): Promise<FinancialTransaction>;
  getAdminFeeStatus(borrowerId: string): Promise<AdminFeeStatus>;
  listBorrowersAwaitingAdminFee(): Promise<AwaitingAdminFeeBorrower[]>;
}

export interface IPaymentService {
  getPaymentEntryContext(borrowerId: string, referenceDate?: string): Promise<PaymentEntryContext>;
  getSameDayPayment(
    borrowerId: string,
    collectorId: string,
    referenceDate?: string,
  ): Promise<PaymentTransaction | null>;
  recordPayment(input: RecordPaymentInput): Promise<PaymentTransaction>;
  editPayment(paymentId: string, input: EditPaymentInput): Promise<PaymentTransaction>;
}

export interface ILoanPoolService {
  listLoanPools(): Promise<LoanPoolListResponse>;
  getLoanPool(id: string): Promise<LoanPoolDetail>;
}

export interface IGroupService {
  listGroups(): Promise<GroupListResponse>;
  getGroup(id: string): Promise<GroupDetail>;
  flagGroup(input: FlagGroupInput): Promise<GroupDetail>;
  reassignCollector(input: ReassignGroupCollectorInput): Promise<GroupDetail>;
  validateMembershipRemoval(input: GroupMembershipChangeInput): Promise<GroupMembershipChangeResult>;
  removeMember(input: GroupMembershipChangeInput): Promise<GroupDetail>;
  addMember(input: AddGroupMemberInput): Promise<GroupDetail>;
  transferMember(input: TransferGroupMemberInput): Promise<GroupDetail>;
  replaceLeader(input: ReplaceGroupLeaderInput): Promise<GroupDetail>;
  updateDisplayName(input: UpdateGroupDisplayNameInput): Promise<GroupDetail>;
  recordAdjustment(input: RecordGroupAdjustmentInput): Promise<GroupDetail>;
}

export interface ICollectorManagementService {
  listCollectors(): Promise<CollectorListResponse>;
  getCollector(id: string): Promise<CollectorDetail>;
}

export interface IRiskFlagService {
  listRiskFlags(): Promise<RiskFlagListResponse>;
  getRiskFlag(id: string): Promise<RiskFlagDetail>;
}

export interface IOverpaymentReviewService {
  listPendingReviews(): Promise<OverpaymentReviewListResponse>;
  queueReview(input: QueueOverpaymentReviewInput): Promise<OverpaymentReview>;
  resolveReview(
    id: string,
    input: ResolveOverpaymentReviewInput,
    actorId: string,
    actorDisplayName: string,
  ): Promise<OverpaymentReview>;
}

export interface ReconciliationSummary {
  collectorId: string;
  date: string;
  expectedPesewas: number;
  actualPesewas: number;
  physicalCashPesewas?: number;
  variancePesewas: number;
  varianceFlagged?: boolean;
  submitted: boolean;
  submittedAt?: string;
}

export interface ICollectorService {
  getDashboard(collectorId: string, date?: string): Promise<CollectorDashboard>;
  listAssignedBorrowers(
    collectorId: string,
    date?: string,
  ): Promise<CollectorDashboard['borrowers']>;
}

export interface IDashboardService {
  getDashboardSummary(): Promise<DashboardSummary>;
}

export interface IReconciliationService {
  getCollectorReconciliation(collectorId: string, date: string): Promise<ReconciliationSummary>;
  submitReconciliation(input: SubmitReconciliationInput): Promise<ReconciliationSummary>;
}

export interface ReportSummary {
  id: string;
  title: string;
  generatedAt: string;
  category: ReportCategory;
  description: string;
  recordCount: number;
  route: string;
}

export interface IReportService {
  listAvailableReports(): Promise<ReportSummary[]>;
  getReportsHubMetadata(): Promise<ReportsHubMetadata>;
  getLoanPortfolioReport(params?: LoanPortfolioReportParams): Promise<LoanPortfolioReport>;
  getDailyCollectionReport(params: DailyCollectionReportParams): Promise<DailyCollectionReport>;
  getDefaulterReport(): Promise<DefaulterReport>;
  getCollectorPerformanceReport(): Promise<CollectorPerformanceReport>;
  getGroupRiskReport(): Promise<GroupRiskReport>;
  getFinancialLedgerReport(params?: FinancialLedgerReportParams): Promise<FinancialLedgerReport>;
}

export interface IAdjustmentService {
  listPendingAdjustments(): Promise<AdjustmentListResponse>;
  createAdjustment(
    input: CreateAdjustmentInput,
    actorId: string,
    actorDisplayName: string,
  ): Promise<AdjustmentRequest>;
  approveAdjustment(
    id: string,
    actorId: string,
    actorDisplayName: string,
  ): Promise<AdjustmentRequest>;
  rejectAdjustment(
    id: string,
    input: RejectAdjustmentInput,
    actorId: string,
    actorDisplayName: string,
  ): Promise<AdjustmentRequest>;
}

export interface ISettingsService {
  getSettings(): Promise<SystemSettings>;
  updateSettings(input: UpdateSystemSettingsInput): Promise<SystemSettings>;
  getSettingsMe(): Promise<SettingsMeProfile>;
  updateSettingsMe(input: UpdateSettingsMeInput): Promise<SettingsMeProfile>;
  sendTestSms(phone: string): Promise<{ ok: true }>;
  getSmsBalance(): Promise<{ balance: string }>;
  sendTestEmail(email: string): Promise<{ ok: true }>;
  listUsers(): Promise<SettingsUserRecord[]>;
  getUserProfile(userId: string): Promise<SettingsUserProfile>;
  getSettingsActivity(): Promise<SettingsActivityEntry[]>;
  listPermissions(): Promise<PermissionDefinition[]>;
  listRoles(): Promise<RoleDefinition[]>;
  createRole(input: CreateRoleInput): Promise<RoleDefinition>;
  updateRole(id: string, input: UpdateRoleInput): Promise<RoleDefinition>;
  deleteRole(id: string): Promise<void>;
  cloneRole(id: string): Promise<RoleDefinition>;
  createUser(input: CreateSettingsUserInput): Promise<SettingsUserRecord>;
  updateUser(id: string, input: UpdateSettingsUserInput): Promise<SettingsUserRecord>;
  disableUser(id: string): Promise<SettingsUserRecord>;
  activateUser(id: string): Promise<SettingsUserRecord>;
  deleteUser(id: string): Promise<void>;
  getRegistrationLegalConfig(): Promise<RegistrationLegalConfig>;
}

export interface ICollectionMetricsService {
  getMetrics(query: CollectionMetricsQuery): Promise<CollectionMetricsResponse>;
}

export interface IExpenseService {
  listExpenses(): Promise<ExpenseListResponse>;
  createExpense(input: CreateExpenseInput): Promise<ExpenseRecord>;
  reviewExpense(id: string, input: ReviewExpenseInput): Promise<ExpenseRecord>;
  getExpenseSummary(): Promise<{
    todayPesewas: number;
    weekPesewas: number;
    monthPesewas: number;
    yearPesewas: number;
  }>;
}

export interface SupervisorAlertInput {
  message: string;
  collectorId: string;
  paymentId: string;
}

export interface INotificationService {
  listInbox(): Promise<import('@/types/notification').NotificationInboxItem[]>;
  getUnreadCount(): Promise<number>;
  markAsRead(notificationId: string): Promise<void>;
  sendNotification(input: SendNotificationInput): Promise<NotificationDelivery>;
  sendSupervisorAlert(input: SupervisorAlertInput): Promise<void>;
}

export interface ISearchService {
  globalSearch(
    params: import('@/types/search').GlobalSearchParams,
  ): Promise<import('@/types/search').GlobalSearchResult[]>;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actorId: string;
  actorDisplayName?: string;
  actorPhotoUrl?: string | null;
  targetEntityId: string;
  targetEntityType: AuditTargetEntity;
  reason?: string;
  createdAt: string;
}

export interface AuditListParams {
  limit?: number;
  action?: AuditAction;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface IAuditService {
  createEntry(input: CreateAuditEntryInput): Promise<AuditEntry>;
  listRecentEntries(params?: AuditListParams): Promise<AuditEntry[]>;
}

export interface IGroupFormationService {
  getConfig(): Promise<GroupFormationConfig>;
  getCommunityStatus(community: string): Promise<GroupFormationStatus>;
  processApprovedBorrower(input: {
    borrowerId: string;
    fullName: string;
    community: string;
    approvedAt: string;
  }): Promise<AutoGroupCreationResult>;
}

export interface ILocationService {
  getRegions(): Promise<LocationRegion[]>;
  getDistricts(regionId: string): Promise<LocationDistrict[]>;
  getCities(districtId: string): Promise<LocationCity[]>;
  getCurrentLocation(): Promise<CurrentLocationResult>;
}
