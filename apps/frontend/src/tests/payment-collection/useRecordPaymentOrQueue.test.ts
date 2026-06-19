import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import paymentServiceMock, { resetMockPaymentTransactions } from '@/services/mock/paymentService.mock';
import { USER_ROLE } from '@/constants/roles';
import { useAuthStore } from '@/state/authStore';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockRecordPayment = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  paymentService: {
    recordPayment: mockRecordPayment,
  },
}));

const mockRequestPaymentBackgroundSync = vi.hoisted(() => vi.fn());

vi.mock('@/lib/pwa/background-sync', () => ({
  requestPaymentBackgroundSync: mockRequestPaymentBackgroundSync,
}));

import { useRecordPaymentOrQueue } from '@/features/payment-collection/hooks/useRecordPaymentOrQueue';

describe('useRecordPaymentOrQueue', () => {
  beforeEach(() => {
    resetMockPaymentTransactions();
    useOfflineQueueStore.getState().clearQueue();
    useAuthStore.setState({
      user: {
        id: 'user-collector',
        role: USER_ROLE.COLLECTOR,
        displayName: 'Field Collector',
      },
      expiresAt: Date.now() + 60_000,
      isHydrated: true,
      isExpired: false,
    });
    mockRecordPayment.mockReset();
    mockRecordPayment.mockImplementation((input) => paymentServiceMock.recordPayment(input));
    mockRequestPaymentBackgroundSync.mockReset();
    mockRequestPaymentBackgroundSync.mockResolvedValue(true);
  });

  it('records payment online through the payment service', async () => {
    const { result } = renderHook(() => useRecordPaymentOrQueue(), {
      wrapper: TestQueryProvider,
    });

    await result.current.mutateAsync({
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      paymentDate: '2026-05-29',
      loanId: 'loan-001',
      isOffline: false,
      gps: {
        latitude: 5.6,
        longitude: -0.2,
        capturedAt: '2026-05-29T10:00:00.000Z',
      },
    });

    await waitFor(() => {
      expect(mockRecordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          borrowerId: 'borrower-001',
          collectorId: 'user-collector',
        }),
      );
      expect(useOfflineQueueStore.getState().items).toHaveLength(0);
    });
  });

  it('queues payment locally when offline', async () => {
    const { result } = renderHook(() => useRecordPaymentOrQueue(), {
      wrapper: TestQueryProvider,
    });

    const response = await result.current.mutateAsync({
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      paymentDate: '2026-05-29',
      loanId: 'loan-001',
      isOffline: true,
      gps: {
        latitude: 5.6,
        longitude: -0.2,
        capturedAt: '2026-05-29T10:00:00.000Z',
      },
    });

    expect(response.mode).toBe('offline');
    expect(mockRecordPayment).not.toHaveBeenCalled();
    expect(mockRequestPaymentBackgroundSync).toHaveBeenCalled();
    expect(useOfflineQueueStore.getState().items).toHaveLength(1);
    expect(useOfflineQueueStore.getState().items[0]?.payload.borrowerId).toBe('borrower-001');
  });
});
