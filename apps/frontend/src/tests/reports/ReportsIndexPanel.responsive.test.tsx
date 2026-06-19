import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsIndexPanel } from '@/features/reports/components/ReportsIndexPanel';
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

import reportServiceMock from '@/services/mock/reportService.mock';
import dashboardServiceMock from '@/services/mock/dashboardService.mock';

describe('ReportsIndexPanel responsive layout', () => {
  beforeEach(() => {
    mockListAvailableReports.mockReset();
    mockGetDashboardSummary.mockReset();
    mockGetReportsHubMetadata.mockReset();
    mockListAvailableReports.mockImplementation(() => reportServiceMock.listAvailableReports());
    mockGetDashboardSummary.mockImplementation(() => dashboardServiceMock.getDashboardSummary());
    mockGetReportsHubMetadata.mockImplementation(() => reportServiceMock.getReportsHubMetadata());
  });

  it('renders card grid for mobile-friendly report browsing', async () => {
    const { container } = render(
      <TestQueryProvider>
        <ReportsIndexPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Total Collections')).toBeInTheDocument();

    const table = container.querySelector('table');
    expect(table?.closest('div')).toHaveClass('hidden');
    expect(table?.closest('div')).toHaveClass('md:block');

    expect(container.querySelector('ul')).toHaveClass('sm:grid-cols-2');
  });
});
