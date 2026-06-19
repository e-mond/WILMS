import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import collectorServiceMock from '@/services/mock/collectorService.mock';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { resetPaymentTransactions } from '@/services/mock/payment-transaction.store';
import { resetMockReconciliationSubmissions } from '@/services/mock/reconciliationService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
const mockGetDashboard = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  collectorService: {
    getDashboard: mockGetDashboard,
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-collector',
      role: 'COLLECTOR',
      displayName: 'Demo Collector',
      email: 'collector@wilms.demo',
    },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
    expiresAt: null,
    clearSession: vi.fn(),
  }),
}));

import { CollectorDashboardPanel } from '@/features/payment-collection/components/CollectorDashboardPanel';

describe('CollectorDashboardPanel', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetPaymentTransactions();
    resetMockReconciliationSubmissions();
    mockGetDashboard.mockReset();
    mockGetDashboard.mockImplementation((collectorId: string, date?: string) =>
      collectorServiceMock.getDashboard(collectorId, date ?? '2026-05-29'),
    );
  });

  it('renders collection summary and today borrowers table', async () => {
    render(
      <TestQueryProvider>
        <CollectorDashboardPanel />
      </TestQueryProvider>,
    );

    expect(
      await screen.findByText("Today's Collection", {}, { timeout: 8000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Groups Due Today')).toBeInTheDocument();
    expect(screen.getAllByText('Ama Mensah').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GH₵50.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/missed payment alert/i).length).toBeGreaterThanOrEqual(1);
  });
});
