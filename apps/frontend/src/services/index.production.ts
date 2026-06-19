/**
 * Production service exports — uses API provider when configured, otherwise mock fallback
 * for staging/demo deployments without NEXT_PUBLIC_API_BASE_URL.
 */
export { apiDataProvider as dataProvider } from '@/data-provider/ApiDataProvider';
export { mockDataProvider as mockFallbackProvider } from '@/data-provider/MockDataProvider';

import { apiDataProvider } from '@/data-provider/ApiDataProvider';
import { mockDataProvider } from '@/data-provider/MockDataProvider';
import { resolveDataProviderMode } from '@/data-provider/types';

const activeProvider = resolveDataProviderMode() === 'mock' ? mockDataProvider : apiDataProvider;

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
  notificationService,
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
} = activeProvider;
