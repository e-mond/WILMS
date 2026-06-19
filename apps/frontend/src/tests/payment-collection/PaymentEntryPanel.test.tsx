import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import paymentServiceMock, { resetMockPaymentTransactions } from '@/services/mock/paymentService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { USER_ROLE } from '@/constants/roles';
import { useAuthStore } from '@/state/authStore';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockGetPaymentEntryContext = vi.hoisted(() => vi.fn());
const mockRecordPayment = vi.hoisted(() => vi.fn());
const mockCaptureGps = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockIsOffline = vi.hoisted(() => vi.fn(() => false));

vi.mock('@/services', () => ({
  paymentService: {
    getPaymentEntryContext: mockGetPaymentEntryContext,
    recordPayment: mockRecordPayment,
  },
}));

vi.mock('@/utils/captureGps', () => ({
  captureGps: mockCaptureGps,
  GpsCaptureError: class GpsCaptureError extends Error {
    name = 'GpsCaptureError';
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => ({
    isOnline: !mockIsOffline(),
    isOffline: mockIsOffline(),
  }),
}));

import { PaymentEntryPanel } from '@/features/payment-collection/components/PaymentEntryPanel';

describe('PaymentEntryPanel', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
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
    mockGetPaymentEntryContext.mockReset();
    mockRecordPayment.mockReset();
    mockCaptureGps.mockReset();
    mockPush.mockReset();
    mockIsOffline.mockReturnValue(false);
    mockGetPaymentEntryContext.mockImplementation((borrowerId: string, date?: string) =>
      paymentServiceMock.getPaymentEntryContext(borrowerId, date ?? '2026-05-29'),
    );
    mockCaptureGps.mockResolvedValue({
      latitude: 5.6037,
      longitude: -0.187,
      capturedAt: '2026-05-29T10:00:00.000Z',
    });
    mockRecordPayment.mockImplementation((input) => paymentServiceMock.recordPayment(input));
  });

  it('renders payment amount and oldest obligation details', async () => {
    render(
      <TestQueryProvider>
        <PaymentEntryPanel borrowerId="borrower-001" />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Ama Mensah' })).toBeInTheDocument();
    expect(screen.getByText(/Week 4/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Record weekly payment/i })).toBeEnabled();
  });

  it('queues payment for sync when offline', async () => {
    mockIsOffline.mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <TestQueryProvider>
        <PaymentEntryPanel borrowerId="borrower-001" />
      </TestQueryProvider>,
    );

    await screen.findByRole('heading', { name: 'Ama Mensah' });
    expect(screen.getByText(/Offline mode/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Save weekly payment for sync/i }));
    await user.click(screen.getByRole('button', { name: /Save payment for sync/i }));

    await waitFor(() => {
      expect(mockCaptureGps).toHaveBeenCalled();
      expect(mockRecordPayment).not.toHaveBeenCalled();
      expect(useOfflineQueueStore.getState().items).toHaveLength(1);
      expect(mockPush).toHaveBeenCalledWith('/collector/dashboard');
    });
  });

  it('captures GPS before recording payment', async () => {
    const user = userEvent.setup();
    render(
      <TestQueryProvider>
        <PaymentEntryPanel borrowerId="borrower-001" />
      </TestQueryProvider>,
    );

    await screen.findByRole('heading', { name: 'Ama Mensah' });
    await user.click(screen.getByRole('button', { name: /Record weekly payment/i }));
    await user.click(screen.getByRole('button', { name: /Confirm payment recording/i }));

    await waitFor(() => {
      expect(mockCaptureGps).toHaveBeenCalled();
      expect(mockRecordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          borrowerId: 'borrower-001',
          amountPesewas: 5000,
          gps: expect.objectContaining({ latitude: 5.6037 }),
        }),
      );
      expect(mockPush).toHaveBeenCalledWith('/collector/dashboard');
    });
  });
});
