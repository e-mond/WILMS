import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
import { USER_ROLE } from '@/constants/roles';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-approver', role: USER_ROLE.APPROVER, displayName: 'Loan Approver' },
    isAuthenticated: true,
    isHydrated: true,
    isExpired: false,
    clearSession: vi.fn(),
  }),
}));

vi.mock('@/services', () => ({
  borrowerService: {
    listReviewedApplications: vi.fn().mockResolvedValue([
      {
        borrowerId: 'borrower-001',
        borrowerName: 'Ama Mensah',
        community: 'Madina',
        decision: 'APPROVED',
        reviewedAt: '2026-01-20T09:00:00.000Z',
      },
    ]),
  },
}));

import { ReviewedApplicationsPanel } from '@/features/approval-workflow/components/ReviewedApplicationsPanel';

describe('ReviewedApplicationsPanel', () => {
  it('renders reviewed application history', async () => {
    render(
      <TestQueryProvider>
        <ReviewedApplicationsPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Ama Mensah')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});
