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

vi.mock('@/services/mock/delay', () => ({
  simulateDelay: async () => undefined,
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermission: () => true,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-super-admin',
      role: 'SUPER_ADMIN',
      displayName: 'Demo Admin',
      email: 'admin@wilms.demo',
    },
    isAuthenticated: true,
    isHydrated: true,
  }),
}));

vi.mock('@/services', () => ({
  dashboardService: {
    getDashboardSummary: mockGetDashboardSummary,
  },
  collectionMetricsService: {
    getMetrics: vi.fn(async () => ({
      metrics: [],
      organisationTotal: {
        period: 'DAILY',
        scope: 'ORGANISATION',
        scopeId: 'wilms-org',
        scopeLabel: 'WILMS Organisation',
        expectedPesewas: 0,
        collectedPesewas: 0,
        collectionRatePercent: 0,
        transactionCount: 0,
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
      },
    })),
  },
}));

import { SuperAdminDashboard } from '@/features/super-admin-dashboard/components/SuperAdminDashboard';

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    resetDashboardDemoDataset();
    mockGetDashboardSummary.mockReset();
    mockGetDashboardSummary.mockImplementation(() => dashboardServiceMock.getDashboardSummary());
  });

  it('renders operational dashboard attention queues and links to executive view', async () => {
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
        expect(screen.getByTestId('operational-dashboard')).toBeInTheDocument();
      },
      { timeout: 15_000 },
    );
    expect(screen.getByText('Operations Overview')).toBeInTheDocument();
    expect(
      screen.getByText('Explore portfolio health, loan queues, and collections.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Action centre')).toBeInTheDocument();
    expect(screen.getByText('Metrics & reporting')).toBeInTheDocument();
    expect(screen.getByText('Borrower status')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /portfolio health/i })).toHaveAttribute(
      'href',
      '/executive',
    );
    expect(screen.getByRole('link', { name: /active portfolio/i })).toHaveAttribute(
      'href',
      '/loans',
    );
    expect(screen.getByRole('link', { name: /^loan rules$/i })).toHaveAttribute(
      'href',
      '/settings?section=loan-rules',
    );
    expect(screen.getByTestId('dashboard-reconciliation-summary')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-recent-activity')).toBeInTheDocument();
  });
});
