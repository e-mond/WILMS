import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollectorsMobileCardList } from '@/features/collector-management/components/CollectorsMobileCardList';
import { COLLECTOR_STATUS, type CollectorSummary } from '@/types/collector-management';

const SAMPLE_COLLECTOR: CollectorSummary = {
  id: 'COL-011',
  displayName: 'Ama Osei',
  zone: 'Madina East',
  groupCount: 4,
  borrowerCount: 204,
  expectedPesewas: 5_000_000,
  collectedPesewas: 5_200_000,
  collectionRatePercent: 100,
  recoveryRatePercent: 100,
  reconciliationCount: 8,
  expensesSubmittedCount: 9,
  status: COLLECTOR_STATUS.ACTIVE,
  streakWeeks: 5,
  cycleLabel: 'Jun 2026',
  joinedAt: '2022-02-14',
  lastActiveAt: '2026-06-08T09:42:00.000Z',
  rateTrend: [82, 88, 91, 95, 100],
  monthlyPerformance: [],
};

describe('CollectorsMobileCardList', () => {
  it('renders collector metrics and handles selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <CollectorsMobileCardList
        collectors={[SAMPLE_COLLECTOR]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Ama Osei')).toBeInTheDocument();
    expect(screen.getByText('COL-011')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('5w')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('COL-011');
  });
});
