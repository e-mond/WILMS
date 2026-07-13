import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import auditServiceMock from '@/services/mock/auditService.mock';
import { resetMockAuditLog } from '@/services/mock/auditService.mock';
import { USER_ROLE } from '@/constants/roles';
import { TestAppProviders } from '@/tests/utils/test-app-providers';

const mockListRecentEntries = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-super-admin', role: USER_ROLE.SUPER_ADMIN, displayName: 'Test Admin' },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
    clearSession: vi.fn(),
  }),
}));

vi.mock('@/services', () => ({
  auditService: {
    listRecentEntries: mockListRecentEntries,
  },
  settingsService: {
    listUsers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/hooks/useShellAsideContent', () => ({
  useShellAsideContent: () => undefined,
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
      <TestAppProviders>
        <AuditLogReportPanel />
      </TestAppProviders>,
    );

    expect(await screen.findByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect((await screen.findAllByText('Payment recorded')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Borrower registered').length).toBeGreaterThan(0);
    expect(screen.getByText('Log Status')).toBeInTheDocument();
    expect(screen.getByText('Immutable')).toBeInTheDocument();
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  });
});
