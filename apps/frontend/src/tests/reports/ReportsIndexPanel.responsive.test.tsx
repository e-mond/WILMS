import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsIndexPanel } from '@/features/reports/components/ReportsIndexPanel';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListAvailableReports = vi.hoisted(() => vi.fn());
const mockGetReportsHubMetadata = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  reportService: {
    listAvailableReports: mockListAvailableReports,
    getReportsHubMetadata: mockGetReportsHubMetadata,
  },
}));

import reportServiceMock from '@/services/mock/reportService.mock';

describe('ReportsIndexPanel responsive layout', () => {
  beforeEach(() => {
    mockListAvailableReports.mockReset();
    mockGetReportsHubMetadata.mockReset();
    mockListAvailableReports.mockImplementation(() => reportServiceMock.listAvailableReports());
    mockGetReportsHubMetadata.mockImplementation(() => reportServiceMock.getReportsHubMetadata());
  });

  it('renders the reports table without a mobile card grid', async () => {
    const { container } = render(
      <TestQueryProvider>
        <ReportsIndexPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('link', { name: 'Loan Portfolio Report' })).toBeInTheDocument();

    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    expect(table?.closest('div')).not.toHaveClass('hidden');
    expect(container.querySelector('ul.sm\\:grid-cols-2')).toBeNull();
  });
});
