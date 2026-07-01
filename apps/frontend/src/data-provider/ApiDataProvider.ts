import adjustmentServiceImpl from '@/services/adjustmentService';
import auditServiceImpl from '@/services/auditService';
import settingsServiceImpl from '@/services/settingsService';
import collectorManagementServiceImpl from '@/services/collectorManagementService';
import collectorServiceImpl from '@/services/collectorService';
import dashboardServiceImpl from '@/services/dashboardService';
import groupServiceImpl from '@/services/groupService';
import loanPoolServiceImpl from '@/services/loanPoolService';
import riskFlagServiceImpl from '@/services/riskFlagService';
import authServiceImpl from '@/services/authService';
import borrowerServiceImpl from '@/services/borrowerService';
import loanServiceImpl from '@/services/loanService';
import notificationServiceImpl from '@/services/notificationService';
import searchServiceImpl from '@/services/searchService';
import overpaymentReviewServiceImpl from '@/services/overpaymentReviewService';
import paymentServiceImpl from '@/services/paymentService';
import reconciliationServiceImpl from '@/services/reconciliationService';
import reportServiceImpl from '@/services/reportService';
import transactionServiceImpl from '@/services/transactionService';
import collectionMetricsServiceImpl from '@/services/collectionMetricsService';
import expenseServiceImpl from '@/services/expenseService';
import photoCaptureSessionServiceImpl from '@/services/photoCaptureSessionService';
import groupFormationServiceImpl from '@/services/groupFormationService';
import locationServiceImpl from '@/services/locationService';
import messageServiceImpl from '@/services/messageService';
import offlineSyncServiceImpl from '@/services/offlineSyncService';
import uploadServiceImpl from '@/services/uploadService';
import type { IDataProvider } from '@/data-provider/types';

export const apiDataProvider: IDataProvider = {
  mode: 'api',
  adjustmentService: adjustmentServiceImpl,
  authService: authServiceImpl,
  collectorService: collectorServiceImpl,
  collectorManagementService: collectorManagementServiceImpl,
  dashboardService: dashboardServiceImpl,
  groupService: groupServiceImpl,
  groupFormationService: groupFormationServiceImpl,
  loanPoolService: loanPoolServiceImpl,
  riskFlagService: riskFlagServiceImpl,
  borrowerService: borrowerServiceImpl,
  loanService: loanServiceImpl,
  locationService: locationServiceImpl,
  messageService: messageServiceImpl,
  offlineSyncService: offlineSyncServiceImpl,
  paymentService: paymentServiceImpl,
  reconciliationService: reconciliationServiceImpl,
  reportService: reportServiceImpl,
  notificationService: notificationServiceImpl,
  searchService: searchServiceImpl,
  overpaymentReviewService: overpaymentReviewServiceImpl,
  auditService: auditServiceImpl,
  settingsService: settingsServiceImpl,
  transactionService: transactionServiceImpl,
  collectionMetricsService: collectionMetricsServiceImpl,
  expenseService: expenseServiceImpl,
  photoCaptureSessionService: photoCaptureSessionServiceImpl,
  uploadService: uploadServiceImpl,
};

export default apiDataProvider;
