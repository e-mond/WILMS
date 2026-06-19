import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import borrowerServiceMock, {
  resetMockBorrowerRegistrations,
} from '@/services/mock/borrowerService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListPendingApplications = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  borrowerService: {
    listPendingApplications: mockListPendingApplications,
  },
}));

import { PendingApplicationsQueue } from '@/features/approval-workflow/components/PendingApplicationsQueue';

function renderQueue() {
  return render(
    <TestQueryProvider>
      <PendingApplicationsQueue />
    </TestQueryProvider>,
  );
}

describe('PendingApplicationsQueue', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    mockListPendingApplications.mockImplementation(() =>
      borrowerServiceMock.listPendingApplications(),
    );
  });

  it('lists pending applications with status badges', async () => {
    renderQueue();

    expect(await screen.findByRole('cell', { name: /Kwame Asante/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Adjoa Owusu/i })).toBeInTheDocument();
    expect(screen.getAllByText('Pending')).toHaveLength(2);
    expect(screen.queryByRole('cell', { name: /Ama Mensah/i })).not.toBeInTheDocument();
  });

  it('links each application to the review page', async () => {
    renderQueue();

    const reviewLinks = await screen.findAllByRole('link', { name: 'Review' });
    expect(reviewLinks[0]).toHaveAttribute('href', '/approver/pending/borrower-pending-002');
    expect(reviewLinks[1]).toHaveAttribute('href', '/approver/pending/borrower-pending-001');
  });

  it('filters applications by search query', async () => {
    const user = userEvent.setup();
    renderQueue();

    await screen.findByRole('cell', { name: /Kwame Asante/i });
    await user.type(screen.getByRole('searchbox', { name: 'Search pending applications' }), 'Adjoa');

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: /Adjoa Owusu/i })).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: /Kwame Asante/i })).not.toBeInTheDocument();
    });
  });
});
