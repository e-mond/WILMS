import type {
  IAdjustmentService,
  IAuditService,
  IAuthService,
  IBorrowerService,
  ICollectorManagementService,
  ICollectorService,
  ICollectionMetricsService,
  IDashboardService,
  IExpenseService,
  IGroupService,
  IGroupFormationService,
  ILoanPoolService,
  ILoanService,
  ILocationService,
  INotificationService,
  IOverpaymentReviewService,
  IPaymentService,
  IPhotoCaptureSessionService,
  IReconciliationService,
  IReportService,
  IRiskFlagService,
  ISearchService,
  ISettingsService,
  ITransactionService,
  IUploadService,
} from '@/types/services';

export type DataProviderMode = 'mock' | 'api';

/**
 * Single switch point for all application data access.
 * UI imports services from `@/services` and never from mock modules directly.
 */
export interface IDataProvider {
  readonly mode: DataProviderMode;
  readonly adjustmentService: IAdjustmentService;
  readonly auditService: IAuditService;
  readonly authService: IAuthService;
  readonly borrowerService: IBorrowerService;
  readonly collectorManagementService: ICollectorManagementService;
  readonly collectorService: ICollectorService;
  readonly collectionMetricsService: ICollectionMetricsService;
  readonly dashboardService: IDashboardService;
  readonly expenseService: IExpenseService;
  readonly groupService: IGroupService;
  readonly groupFormationService: IGroupFormationService;
  readonly loanPoolService: ILoanPoolService;
  readonly loanService: ILoanService;
  readonly locationService: ILocationService;
  readonly notificationService: INotificationService;
  readonly overpaymentReviewService: IOverpaymentReviewService;
  readonly paymentService: IPaymentService;
  readonly photoCaptureSessionService: IPhotoCaptureSessionService;
  readonly reconciliationService: IReconciliationService;
  readonly reportService: IReportService;
  readonly riskFlagService: IRiskFlagService;
  readonly searchService: ISearchService;
  readonly settingsService: ISettingsService;
  readonly transactionService: ITransactionService;
  readonly uploadService: IUploadService;
}

export const DEMO_MODE_MESSAGE = 'Demo Mode Active — mock data is in use';

/**
 * Resolves whether the app should use mock or API providers.
 * Build-time webpack alias uses the same rules (see next.config.mjs).
 */
export function resolveDataProviderMode(): DataProviderMode {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return 'mock';
  }

  if (process.env.NEXT_PUBLIC_FORCE_DEMO_MODE === 'true') {
    return 'mock';
  }

  if (process.env.NEXT_PUBLIC_API_DISABLED === 'true') {
    return 'mock';
  }

  if (!process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) {
    return 'mock';
  }

  if (process.env.NEXT_PUBLIC_USE_MOCK === 'false') {
    return 'api';
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'mock';
  }

  return 'api';
}

export function isDemoMode(): boolean {
  return resolveDataProviderMode() === 'mock';
}
