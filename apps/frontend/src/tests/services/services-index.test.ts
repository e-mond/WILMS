import { describe, expect, it } from 'vitest';
import { USE_MOCK_SERVICES } from '@/config/api';
import { apiDataProvider } from '@/data-provider/ApiDataProvider';
import { borrowerService, paymentService } from '@/services/index.development';
import borrowerServiceMock from '@/services/mock/borrowerService.mock';
import paymentServiceMock from '@/services/mock/paymentService.mock';
import borrowerServiceApi from '@/services/borrowerService';
import paymentServiceApi from '@/services/paymentService';

describe('services index', () => {
  it('uses mock implementations in development entry', () => {
    expect(USE_MOCK_SERVICES).toBe(true);
    expect(borrowerService).toBe(borrowerServiceMock);
    expect(paymentService).toBe(paymentServiceMock);
  });

  it('exposes API implementations via ApiDataProvider', () => {
    expect(apiDataProvider.borrowerService).toBe(borrowerServiceApi);
    expect(apiDataProvider.paymentService).toBe(paymentServiceApi);
    expect(apiDataProvider.borrowerService).not.toBe(borrowerServiceMock);
    expect(apiDataProvider.paymentService).not.toBe(paymentServiceMock);
  });
});
