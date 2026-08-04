import { describe, expect, it } from 'vitest';
import { formatGroupLabel } from '@/features/approval-workflow/components/BorrowerReviewProfile';

describe('formatGroupLabel', () => {
  it('formats display id and name without exposing UUIDs', () => {
    expect(
      formatGroupLabel('GRP-2026-015', 'Market Women A', '11111111-1111-4111-8111-111111111111'),
    ).toBe('GRP-2026-015 — Market Women A');
  });

  it('shows Unassigned when no group is present', () => {
    expect(formatGroupLabel(undefined, '', undefined)).toBe('Unassigned');
  });

  it('falls back to name when display id is missing', () => {
    expect(formatGroupLabel(undefined, 'Market Women A', undefined)).toBe('Market Women A');
  });
});
