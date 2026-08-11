import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import paymentServiceMock, { resetMockPaymentTransactions } from '@/services/mock/paymentService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { USER_ROLE } from '@/constants/roles';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import { useAuthStore } from '@/state/authStore';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
import type { PaymentEntryContext } from '@/types/payment-entry';

const mockGetPaymentEntryContext = vi.hoisted(() => vi.fn());
const mockRecordPayment = vi.hoisted(() => vi.fn());
const mockCaptureGps = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockIsOffline = vi.hoisted(() => vi.fn(() => false));

vi.mock('@/services', () => ({
  paymentService: {
    getPaymentEntryContext: mockGetPaymentEntryContext,
    recordPayment: mockRecordPayment,
    markMissedPayment: vi.fn(),
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

function payableContext(overrides: Partial<PaymentEntryContext> = {}): PaymentEntryContext {
  return {
    borrowerId: 'borrower-001',
    borrowerName: 'Ama Mensah',
    phone: '+233241234567',
    community: 'Madina',
    loanId: 'loan-001',
    paymentDay: 'Friday',
    weeklyPaymentPesewas: 5000,
    referenceDate: '2026-05-29',
    isPaymentDay: true,
    requiredAmountPesewas: 5000,
    oldestObligation: {
      weekNumber: 5,
      dueDate: '2026-05-29',
      amountPesewas: 5000,
      status: SCHEDULE_WEEK_STATUS.PENDING,
    },
    obligationWeeks: [
      {
        weekNumber: 5,
        dueDate: '2026-05-29',
        amountPesewas: 5000,
        status: SCHEDULE_WEEK_STATUS.PENDING,
      },
    ],
    payableWeeks: [
      {
        weekNumber: 5,
        dueDate: '2026-05-29',
        amountPesewas: 5000,
        status: SCHEDULE_WEEK_STATUS.PENDING,
      },
    ],
    totalOutstandingObligationsPesewas: 5000,
    maxPayableWeeks: 1,
    canAcceptPayment: true,
    recordedMissed: false,
    ...overrides,
  };
}

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
    mockGetPaymentEntryContext.mockResolvedValue(payableContext());
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
    expect(screen.getByText(/Week 5/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay current week/i })).toBeEnabled();
  });

  it('disables payment buttons when the oldest unpaid week is marked missed', async () => {
    mockGetPaymentEntryContext.mockResolvedValue(
      payableContext({
        oldestObligation: {
          weekNumber: 4,
          dueDate: '2026-05-22',
          amountPesewas: 5000,
          status: SCHEDULE_WEEK_STATUS.MISSED,
        },
        obligationWeeks: [
          {
            weekNumber: 4,
            dueDate: '2026-05-22',
            amountPesewas: 5000,
            status: SCHEDULE_WEEK_STATUS.MISSED,
          },
        ],
        payableWeeks: [
          {
            weekNumber: 4,
            dueDate: '2026-05-22',
            amountPesewas: 5000,
            status: SCHEDULE_WEEK_STATUS.MISSED,
          },
        ],
        canAcceptPayment: false,
        recordedMissed: true,
        blockReason:
          'This borrower was marked missed. Payment buttons are disabled until the missed week is cleared by operations.',
      }),
    );

    render(
      <TestQueryProvider>
        <PaymentEntryPanel borrowerId="borrower-001" />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Ama Mensah' })).toBeInTheDocument();
    expect(screen.getByText(/marked missed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay current week/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Mark this week as missed/i })).toBeDisabled();
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
    await user.click(screen.getByRole('button', { name: /Pay current week/i }));
    await user.click(screen.getByRole('button', { name: /Save for sync/i }));

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
    await user.click(screen.getByRole('button', { name: /Pay current week/i }));
    await user.click(screen.getByRole('button', { name: /Confirm payment/i }));

    await waitFor(() => {
      expect(mockCaptureGps).toHaveBeenCalled();
      expect(mockRecordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          borrowerId: 'borrower-001',
          amountPesewas: 5000,
          weeksCount: 1,
          gps: expect.objectContaining({ latitude: 5.6037 }),
        }),
      );
      expect(mockPush).toHaveBeenCalledWith('/collector/dashboard');
    });
  });
});
