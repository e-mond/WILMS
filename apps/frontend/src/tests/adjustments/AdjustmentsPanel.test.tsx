import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import adjustmentServiceMock from '@/services/mock/adjustmentService.mock';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

const mockListPendingAdjustments = vi.hoisted(() => vi.fn());

vi.mock('@/services', () => ({
  adjustmentService: {
    listPendingAdjustments: mockListPendingAdjustments,
  },
}));

import { AdjustmentsPanel } from '@/features/adjustments/components/AdjustmentsPanel';

describe('AdjustmentsPanel', () => {
  beforeEach(() => {
    mockListPendingAdjustments.mockReset();
    mockListPendingAdjustments.mockImplementation(() =>
      adjustmentServiceMock.listPendingAdjustments(),
    );
  });

  it('renders pending adjustment requests', async () => {
    render(
      <TestQueryProvider>
        <AdjustmentsPanel />
      </TestQueryProvider>,
    );

    expect(await screen.findByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getAllByText('Ama Mensah').length).toBeGreaterThan(0);
    expect(screen.getByText(/Duplicate payment recorded/)).toBeInTheDocument();
  });
});
