import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardReconciliationSummary } from '@/features/super-admin-dashboard/components/DashboardReconciliationSummary';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

vi.mock('@/features/reconciliation/hooks/useReconciliationReview', () => ({
  useReconciliationList: () => ({
    data: [
      {
        id: 'recon-1',
        collectorId: 'col-1',
        collectorLabel: 'Kwame Mensah (COL-012)',
        date: '2026-08-12',
        expectedPesewas: 10000,
        actualPesewas: 9000,
        physicalCashPesewas: 9000,
        variancePesewas: -1000,
        varianceFlagged: true,
        submitted: true,
        submittedAt: '2026-08-12T10:00:00.000Z',
        status: 'PENDING_REVIEW',
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe('DashboardReconciliationSummary', () => {
  it('shows pending reconciliations with collector labels and status', async () => {
    render(
      <TestQueryProvider>
        <DashboardReconciliationSummary />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Kwame Mensah (COL-012)')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  });
});
