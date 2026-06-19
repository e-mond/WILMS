import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import dashboardServiceMock from '@/services/mock/dashboardService.mock';
import { resetDashboardDemoDataset } from '@/services/mock/factories/dashboard-demo.factory';
import { AsideSlotProvider, useAsideSlot } from '@/components/layout/shell/AsideSlotContext';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
import type { ReactNode } from 'react';

function AsideSlotTestHarness({ children }: { children: ReactNode }) {
  const { content } = useAsideSlot();

  return (
    <>
      {children}
      <div data-testid="shell-aside">{content}</div>
    </>
  );
}

const mockGetDashboardSummary = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  dashboardService: {
    getDashboardSummary: mockGetDashboardSummary,
  },
}));

import { SuperAdminDashboard } from '@/features/super-admin-dashboard/components/SuperAdminDashboard';

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    resetDashboardDemoDataset();
    mockGetDashboardSummary.mockReset();
    mockGetDashboardSummary.mockImplementation(() => dashboardServiceMock.getDashboardSummary());
  });

  it('renders executive dashboard KPIs and sections from service data', async () => {
    render(
      <TestQueryProvider>
        <AsideSlotProvider>
          <AsideSlotTestHarness>
            <SuperAdminDashboard />
          </AsideSlotTestHarness>
        </AsideSlotProvider>
      </TestQueryProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByText('Total Pool Funds')).toBeInTheDocument();
      },
      { timeout: 15_000 },
    );
    expect(screen.getByText('Borrower Status')).toBeInTheDocument();
    expect(screen.getByText('Collector Performance')).toBeInTheDocument();
    expect(screen.getByText('Group Risk Distribution')).toBeInTheDocument();
    expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
    expect(screen.getByText(/critical/)).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('GH₵4,820,000.00')).toBeInTheDocument();
  });
});
