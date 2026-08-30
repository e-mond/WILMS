import { BORROWER_STATUS } from '@wilms/shared-contracts';

export type DashboardBorrowerSegmentTone =
  | 'active'
  | 'atRisk'
  | 'defaulted'
  | 'blacklisted'
  | 'pending';

/**
 * BRD repayment escalation for dashboard tiles:
 * stored PENDING / BLACKLISTED win; otherwise missed schedule weeks drive At risk / Defaulted.
 * 1+ missed week → At risk; 2+ missed weeks → Defaulted (matches consecutive-miss threshold in practice).
 */
export function classifyBorrowerSegmentTone(input: {
  status: string;
  missedWeeks?: number;
}): DashboardBorrowerSegmentTone {
  if (input.status === BORROWER_STATUS.PENDING) {
    return 'pending';
  }

  if (input.status === BORROWER_STATUS.BLACKLISTED) {
    return 'blacklisted';
  }

  const missedWeeks = Math.max(0, input.missedWeeks ?? 0);

  if (input.status === BORROWER_STATUS.DEFAULTED || missedWeeks >= 2) {
    return 'defaulted';
  }

  if (input.status === BORROWER_STATUS.AT_RISK || missedWeeks >= 1) {
    return 'atRisk';
  }

  return 'active';
}

export function buildBorrowerSegmentsFromStatuses(
  borrowers: ReadonlyArray<{ status: string; id: string }>,
  missedWeeksByBorrowerId: ReadonlyMap<string, number> = new Map(),
): Array<{
  id: string;
  label: string;
  count: number;
  tone: DashboardBorrowerSegmentTone;
}> {
  const counts: Record<DashboardBorrowerSegmentTone, number> = {
    active: 0,
    atRisk: 0,
    defaulted: 0,
    blacklisted: 0,
    pending: 0,
  };

  for (const borrower of borrowers) {
    const tone = classifyBorrowerSegmentTone({
      status: borrower.status,
      missedWeeks: missedWeeksByBorrowerId.get(borrower.id) ?? 0,
    });
    counts[tone] += 1;
  }

  return [
    { id: 'active', label: 'Active', count: counts.active, tone: 'active' },
    { id: 'at-risk', label: 'At risk', count: counts.atRisk, tone: 'atRisk' },
    { id: 'defaulted', label: 'Defaulted', count: counts.defaulted, tone: 'defaulted' },
    { id: 'blacklisted', label: 'Blacklisted', count: counts.blacklisted, tone: 'blacklisted' },
    { id: 'pending', label: 'Pending', count: counts.pending, tone: 'pending' },
  ];
}
