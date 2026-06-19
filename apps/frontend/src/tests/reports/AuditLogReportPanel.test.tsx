import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import auditServiceMock from '@/services/mock/auditService.mock';
import { resetMockAuditLog } from '@/services/mock/auditService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListRecentEntries = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  auditService: {
    listRecentEntries: mockListRecentEntries,
  },
}));

import { AuditLogReportPanel } from '@/features/reports/components/AuditLogReportPanel';

describe('AuditLogReportPanel', () => {
  beforeEach(() => {
    resetMockAuditLog();
    mockListRecentEntries.mockReset();
    mockListRecentEntries.mockImplementation((params) => auditServiceMock.listRecentEntries(params));
  });

  it('renders immutable audit entries and export action', async () => {
    render(
      <TestQueryProvider>
        <AuditLogReportPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByRole('table', { name: 'Audit log entries' })).toBeInTheDocument();
    expect(screen.getAllByText('Payment recorded').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Borrower registered').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByText('Log Status')).toBeInTheDocument();
    expect(screen.getByText('Immutable')).toBeInTheDocument();
  });
});
