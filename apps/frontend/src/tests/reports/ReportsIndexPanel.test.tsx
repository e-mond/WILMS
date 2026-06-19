import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reportServiceMock from '@/services/mock/reportService.mock';
import dashboardServiceMock from '@/services/mock/dashboardService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListAvailableReports = vi.hoisted(() => vi.fn());
const mockGetDashboardSummary = vi.hoisted(() => vi.fn());
const mockGetReportsHubMetadata = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  reportService: {
    listAvailableReports: mockListAvailableReports,
    getReportsHubMetadata: mockGetReportsHubMetadata,
  },
  dashboardService: {
    getDashboardSummary: mockGetDashboardSummary,
  },
}));

import { ReportsIndexPanel } from '@/features/reports/components/ReportsIndexPanel';

describe('ReportsIndexPanel', () => {
  beforeEach(() => {
    mockListAvailableReports.mockReset();
    mockGetDashboardSummary.mockReset();
    mockGetReportsHubMetadata.mockReset();
    mockListAvailableReports.mockImplementation(() => reportServiceMock.listAvailableReports());
    mockGetDashboardSummary.mockImplementation(() => dashboardServiceMock.getDashboardSummary());
    mockGetReportsHubMetadata.mockImplementation(() => reportServiceMock.getReportsHubMetadata());
  });

  it('lists all available report links', async () => {
    render(
      <TestQueryProvider>
        <ReportsIndexPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('link', { name: 'Loan Portfolio Report' })).toHaveAttribute(
      'href',
      '/reports/loan-portfolio',
    );
    expect(screen.getByRole('link', { name: 'Defaulter Report' })).toHaveAttribute(
      'href',
      '/reports/defaulters',
    );
    expect(screen.getByRole('link', { name: 'Financial Ledger Report' })).toHaveAttribute(
      'href',
      '/reports/financial-ledger',
    );
    expect(screen.getByRole('link', { name: 'Audit Log Report' })).toHaveAttribute(
      'href',
      '/reports/audit-log',
    );
  });
});
