import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import adjustmentServiceMock, { resetMockAdjustments } from '@/services/mock/adjustmentService.mock';
import { resetAuditLog } from '@/services/mock/audit-log.store';
import { USER_ROLE } from '@/constants/roles';
import { useAuthStore } from '@/state/authStore';
import { PAYMENT_TRANSACTION_STATUS } from '@/types/payment';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockCreateAdjustment = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  adjustmentService: {
    createAdjustment: mockCreateAdjustment,
  },
  paymentService: {
    editPayment: vi.fn(),
  },
}));

vi.mock('@/utils/captureGps', () => ({
  captureGps: vi.fn(),
  GpsCaptureError: class GpsCaptureError extends Error {
    name = 'GpsCaptureError';
  },
}));

import { PaymentEditSection } from '@/features/payment-collection/components/PaymentEditSection';

const lockedPayment = {
  id: 'payment-locked-001',
  borrowerId: 'borrower-001',
  amountPesewas: 5000,
  paymentDate: '2026-05-28',
  gps: {
    latitude: 5.6037,
    longitude: -0.187,
    capturedAt: '2026-05-28T10:00:00.000Z',
  },
  collectorId: 'user-collector',
  recordedAt: '2026-05-28T10:00:00.000Z',
  status: PAYMENT_TRANSACTION_STATUS.CONFIRMED,
};

describe('PaymentEditSection', () => {
  beforeEach(() => {
    resetMockAdjustments();
    resetAuditLog();
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
    mockCreateAdjustment.mockReset();
    mockCreateAdjustment.mockImplementation((input, actorId, actorDisplayName) =>
      adjustmentServiceMock.createAdjustment(input, actorId, actorDisplayName),
    );
  });

  it('shows Super Admin adjustment request form when the payment day has ended', async () => {
    render(
      <TestQueryProvider>
        <PaymentEditSection
          payment={lockedPayment}
          borrowerName="Ama Mensah"
          loanId="loan-001"
          referenceDate="2026-05-29"
        />
      </TestQueryProvider>,
    );

    expect(screen.getByText(/Correction locked/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Request Super Admin payment adjustment/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Save same-day payment correction/i }),
    ).not.toBeInTheDocument();
  });

  it('submits a payment correction adjustment request for locked payments', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <TestQueryProvider>
        <PaymentEditSection
          payment={lockedPayment}
          borrowerName="Ama Mensah"
          loanId="loan-001"
          referenceDate="2026-05-29"
        />
      </TestQueryProvider>,
    );

    await user.type(
      screen.getByLabelText(/Adjustment reason/i),
      'Wrong amount was recorded after the borrower left the field.',
    );
    await user.click(screen.getByRole('button', { name: /Request Super Admin payment adjustment/i }));

    await waitFor(
      () => {
      expect(mockCreateAdjustment).toHaveBeenCalledWith(
        expect.objectContaining({
          borrowerId: 'borrower-001',
          borrowerName: 'Ama Mensah',
          loanId: 'loan-001',
          amountPesewas: 5000,
          reason: expect.stringContaining('payment-locked-001'),
        }),
        'user-collector',
        'Field Collector',
      );
      expect(screen.getByText(/Adjustment request submitted/i)).toBeInTheDocument();
      },
      { timeout: 10_000 },
    );
  }, 15_000);
});
