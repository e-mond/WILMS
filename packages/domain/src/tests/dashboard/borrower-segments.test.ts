import { describe, expect, it } from 'vitest';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import {
  buildBorrowerSegmentsFromStatuses,
  classifyBorrowerSegmentTone,
} from '../../modules/dashboard/borrower-segments.js';

describe('borrower dashboard segments', () => {
  it('keeps pending and blacklisted from stored status', () => {
    expect(classifyBorrowerSegmentTone({ status: BORROWER_STATUS.PENDING, missedWeeks: 5 })).toBe(
      'pending',
    );
    expect(
      classifyBorrowerSegmentTone({ status: BORROWER_STATUS.BLACKLISTED, missedWeeks: 0 }),
    ).toBe('blacklisted');
  });

  it('escalates approved borrowers from missed schedule weeks', () => {
    expect(classifyBorrowerSegmentTone({ status: BORROWER_STATUS.APPROVED, missedWeeks: 0 })).toBe(
      'active',
    );
    expect(classifyBorrowerSegmentTone({ status: BORROWER_STATUS.APPROVED, missedWeeks: 1 })).toBe(
      'atRisk',
    );
    expect(classifyBorrowerSegmentTone({ status: BORROWER_STATUS.APPROVED, missedWeeks: 2 })).toBe(
      'defaulted',
    );
  });

  it('builds segment counts from statuses and missed weeks', () => {
    const segments = buildBorrowerSegmentsFromStatuses(
      [
        { id: 'b1', status: BORROWER_STATUS.APPROVED },
        { id: 'b2', status: BORROWER_STATUS.APPROVED },
        { id: 'b3', status: BORROWER_STATUS.PENDING },
        { id: 'b4', status: BORROWER_STATUS.BLACKLISTED },
      ],
      new Map([
        ['b1', 1],
        ['b2', 3],
      ]),
    );

    expect(segments.find((s) => s.id === 'active')?.count).toBe(0);
    expect(segments.find((s) => s.id === 'at-risk')?.count).toBe(1);
    expect(segments.find((s) => s.id === 'defaulted')?.count).toBe(1);
    expect(segments.find((s) => s.id === 'pending')?.count).toBe(1);
    expect(segments.find((s) => s.id === 'blacklisted')?.count).toBe(1);
  });
});
