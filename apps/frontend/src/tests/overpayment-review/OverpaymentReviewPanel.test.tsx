import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import overpaymentReviewServiceMock, {
  resetMockOverpaymentReviews,
} from '@/services/mock/overpaymentReviewService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListPendingReviews = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  overpaymentReviewService: {
    listPendingReviews: mockListPendingReviews,
    resolveReview: vi.fn(),
  },
}));

import { OverpaymentReviewPanel } from '@/features/overpayment-review/components/OverpaymentReviewPanel';

describe('OverpaymentReviewPanel', () => {
  beforeEach(() => {
    resetMockOverpaymentReviews();
    mockListPendingReviews.mockReset();
    mockListPendingReviews.mockImplementation(() =>
      overpaymentReviewServiceMock.listPendingReviews(),
    );
  });

  it('renders pending overpayment reviews', async () => {
    render(
      <TestQueryProvider>
        <OverpaymentReviewPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Overpayment Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Ama Mensah')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
  });
});
