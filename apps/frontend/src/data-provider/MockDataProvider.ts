import adjustmentServiceMock from '@/services/mock/adjustmentService.mock';
import auditServiceMock from '@/services/mock/auditService.mock';
import settingsServiceMock from '@/services/mock/settingsService.mock';
import collectorManagementServiceMock from '@/services/mock/collectorManagementService.mock';
import collectorServiceMock from '@/services/mock/collectorService.mock';
import dashboardServiceMock from '@/services/mock/dashboardService.mock';
import groupServiceMock from '@/services/mock/groupService.mock';
import loanPoolServiceMock from '@/services/mock/loanPoolService.mock';
import riskFlagServiceMock from '@/services/mock/riskFlagService.mock';
import authServiceImpl from '@/services/authService';
import borrowerServiceMock from '@/services/mock/borrowerService.mock';
import loanServiceMock from '@/services/mock/loanService.mock';
import notificationServiceMock from '@/services/mock/notificationService.mock';
import searchServiceMock from '@/services/mock/searchService.mock';
import overpaymentReviewServiceMock from '@/services/mock/overpaymentReviewService.mock';
import paymentServiceMock from '@/services/mock/paymentService.mock';
import reconciliationServiceMock from '@/services/mock/reconciliationService.mock';
import reportServiceMock from '@/services/mock/reportService.mock';
import transactionServiceMock from '@/services/mock/transactionService.mock';
import collectionMetricsServiceMock from '@/services/mock/collectionMetricsService.mock';
import expenseServiceMock from '@/services/mock/expenseService.mock';
import photoCaptureSessionServiceMock from '@/services/mock/photoCaptureSessionService.mock';
import groupFormationServiceMock from '@/services/mock/groupFormationService.mock';
import locationServiceMock from '@/services/mock/locationService.mock';
import uploadServiceMock from '@/services/mock/uploadService.mock';
import type { IDataProvider } from '@/data-provider/types';

export const mockDataProvider: IDataProvider = {
  mode: 'mock',
  adjustmentService: adjustmentServiceMock,
  authService: authServiceImpl,
  collectorService: collectorServiceMock,
  collectorManagementService: collectorManagementServiceMock,
  dashboardService: dashboardServiceMock,
  groupService: groupServiceMock,
  groupFormationService: groupFormationServiceMock,
  loanPoolService: loanPoolServiceMock,
  riskFlagService: riskFlagServiceMock,
  borrowerService: borrowerServiceMock,
  loanService: loanServiceMock,
  locationService: locationServiceMock,
  paymentService: paymentServiceMock,
  reconciliationService: reconciliationServiceMock,
  reportService: reportServiceMock,
  notificationService: notificationServiceMock,
  searchService: searchServiceMock,
  overpaymentReviewService: overpaymentReviewServiceMock,
  auditService: auditServiceMock,
  settingsService: settingsServiceMock,
  transactionService: transactionServiceMock,
  collectionMetricsService: collectionMetricsServiceMock,
  expenseService: expenseServiceMock,
  photoCaptureSessionService: photoCaptureSessionServiceMock,
  uploadService: uploadServiceMock,
};

export default mockDataProvider;
