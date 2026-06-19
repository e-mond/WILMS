import { describe, expect, it } from 'vitest';
import { approvalReasonSchema } from '@/features/approval-workflow/approval.schema';

describe('approvalReasonSchema', () => {
  it('requires a non-empty reason', () => {
    const result = approvalReasonSchema.safeParse({ reason: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a trimmed reason', () => {
    const result = approvalReasonSchema.safeParse({ reason: 'Incomplete documentation' });
    expect(result.success).toBe(true);
  });
});
