import { mockDataProvider } from '@/data-provider/MockDataProvider';

/**
 * Development/demo service exports — always uses MockDataProvider.
 */
export { mockDataProvider as dataProvider };

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
  communicationService,
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
} = mockDataProvider;
