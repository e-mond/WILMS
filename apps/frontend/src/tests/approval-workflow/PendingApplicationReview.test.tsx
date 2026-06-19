import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import { USER_ROLE } from '@/constants/roles';
import borrowerServiceMock, {
  resetMockBorrowerRegistrations,
} from '@/services/mock/borrowerService.mock';
import { useAuthStore } from '@/state/authStore';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const push = vi.fn();
const mockGetBorrowerReview = vi.hoisted(() => vi.fn());
const mockApproveBorrower = vi.hoisted(() => vi.fn());
const mockRejectBorrower = vi.hoisted(() => vi.fn());
const mockBlacklistBorrower = vi.hoisted(() => vi.fn());
const mockListPendingApplications = vi.hoisted(() => vi.fn());
const mockCreateAuditEntry = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/services', () => ({
  borrowerService: {
    getBorrowerReview: mockGetBorrowerReview,
    approveBorrower: mockApproveBorrower,
    rejectBorrower: mockRejectBorrower,
    blacklistBorrower: mockBlacklistBorrower,
    listPendingApplications: mockListPendingApplications,
    listReviewedApplications: vi.fn().mockResolvedValue([]),
  },
  auditService: {
    createEntry: mockCreateAuditEntry,
  },
}));

import { PendingApplicationReview } from '@/features/approval-workflow/components/PendingApplicationReview';

function renderReview(borrowerId = 'borrower-pending-001') {
  return render(
    <TestQueryProvider>
      <PendingApplicationReview borrowerId={borrowerId} />
    </TestQueryProvider>,
  );
}

describe.sequential('PendingApplicationReview', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    push.mockReset();
    useAuthStore.setState({
      user: {
        id: 'user-approver',
        role: USER_ROLE.APPROVER,
        displayName: 'Test Approver',
      },
      expiresAt: Date.now() + 60_000,
      isHydrated: true,
      isExpired: false,
    });
    mockCreateAuditEntry.mockReset();
    mockCreateAuditEntry.mockResolvedValue({
      id: 'audit-test',
      action: AUDIT_ACTION.BORROWER_APPROVED,
      actorId: 'user-approver',
      targetEntityId: 'borrower-pending-001',
      targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
      createdAt: new Date().toISOString(),
    });
    mockGetBorrowerReview.mockClear();
    mockApproveBorrower.mockClear();
    mockRejectBorrower.mockClear();
    mockBlacklistBorrower.mockClear();
    mockListPendingApplications.mockClear();
    mockGetBorrowerReview.mockImplementation((id: string) => borrowerServiceMock.getBorrowerReview(id));
    mockApproveBorrower.mockImplementation((id: string) => borrowerServiceMock.approveBorrower(id));
    mockRejectBorrower.mockImplementation((id: string, input: { reason: string }) =>
      borrowerServiceMock.rejectBorrower(id, input),
    );
    mockBlacklistBorrower.mockImplementation((id: string, input: { reason: string }) =>
      borrowerServiceMock.blacklistBorrower(id, input),
    );
    mockListPendingApplications.mockImplementation(() => borrowerServiceMock.listPendingApplications());
  });

  it('renders the borrower review profile with pending status', async () => {
    renderReview();

    expect(await screen.findByRole('heading', { name: 'Adjoa Owusu' })).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Adjoa Provisions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve application' })).toBeInTheDocument();
  });

  it('approves a pending application and redirects to the next queue item', async () => {
    const user = userEvent.setup({ delay: null });
    renderReview();

    expect(await screen.findByText('Pending')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Approve application' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm approve' }));

    await waitFor(
      () => {
      expect(mockApproveBorrower).toHaveBeenCalledWith('borrower-pending-001');
      expect(mockCreateAuditEntry).toHaveBeenCalledWith({
        action: AUDIT_ACTION.BORROWER_APPROVED,
        actorId: 'user-approver',
        actorDisplayName: 'Test Approver',
        targetEntityId: 'borrower-pending-001',
        targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
        reason: undefined,
      });
      expect(push).toHaveBeenCalledWith('/approver/pending/borrower-pending-002');
      },
      { timeout: 10_000 },
    );
  });

  it('requires a reason before rejecting an application', async () => {
    const user = userEvent.setup();
    renderReview();

    await screen.findByRole('button', { name: 'Reject application' });
    await user.click(screen.getByRole('button', { name: 'Reject application' }));
    await user.click(screen.getByRole('button', { name: 'Confirm reject' }));

    expect(await screen.findByText('A reason is required.')).toBeInTheDocument();
    expect(mockRejectBorrower).not.toHaveBeenCalled();
  });

  it('rejects an application with a reason', async () => {
    const user = userEvent.setup({ delay: null });
    renderReview('borrower-pending-002');

    await screen.findByRole('button', { name: 'Reject application' });
    await user.click(screen.getByRole('button', { name: 'Reject application' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Reason'), {
      target: { value: 'Identity could not be verified.' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Confirm reject' }));

    await waitFor(
      () => {
      expect(mockRejectBorrower).toHaveBeenCalledWith('borrower-pending-002', {
        reason: 'Identity could not be verified.',
      });
      expect(mockCreateAuditEntry).toHaveBeenCalledWith({
        action: AUDIT_ACTION.BORROWER_REJECTED,
        actorId: 'user-approver',
        actorDisplayName: 'Test Approver',
        targetEntityId: 'borrower-pending-002',
        targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
        reason: 'Identity could not be verified.',
      });
      expect(push).toHaveBeenCalledWith('/approver/pending/borrower-pending-001');
      },
      { timeout: 10_000 },
    );
  });
});
