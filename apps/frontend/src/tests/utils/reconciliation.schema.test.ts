import { describe, expect, it } from 'vitest';
import { flaggedCommentSchema } from '@/utils/reconciliation.schema';

describe('reconciliation.schema', () => {
  it('allows empty comment when variance is not flagged', () => {
    expect(flaggedCommentSchema(false).safeParse('').success).toBe(true);
  });

  it('rejects short comment when variance is flagged', () => {
    const result = flaggedCommentSchema(true).safeParse('too short');
    expect(result.success).toBe(false);
  });

  it('accepts valid comment when variance is flagged', () => {
    const result = flaggedCommentSchema(true).safeParse(
      'Collector held less cash than expected due to delayed collections.',
    );
    expect(result.success).toBe(true);
  });
});
