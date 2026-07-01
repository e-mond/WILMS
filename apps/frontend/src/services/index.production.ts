/**
 * Production builds always use the API data provider — mock/demo mode is disabled.
 */
import { apiDataProvider } from '@/data-provider/ApiDataProvider';

export { apiDataProvider as dataProvider } from '@/data-provider/ApiDataProvider';

export const {
  adjustmentService,
  auditService,
  authService,
  borrowerService,
  collectorManagementService,
  collectorService,
  collectionMetricsService,
  dashboardService,
  expenseService,
  groupService,
  groupFormationService,
  loanPoolService,
  loanService,
  locationService,
  messageService,
  notificationService,
  offlineSyncService,
  overpaymentReviewService,
  paymentService,
  photoCaptureSessionService,
  reconciliationService,
  reportService,
  riskFlagService,
  searchService,
  settingsService,
  transactionService,
  uploadService,
} = apiDataProvider;
