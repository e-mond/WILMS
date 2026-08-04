import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const createThreadSchema = z.object({
  collectorId: z.string().trim().min(1).max(128),
  adminId: z.string().trim().min(1).max(128).optional(),
});

describe('messages createThread schema', () => {
  it('accepts demo collector user ids that are not UUIDs', () => {
    const parsed = createThreadSchema.safeParse({ collectorId: 'user-collector' });
    expect(parsed.success).toBe(true);
  });

  it('accepts uuidv7 collector user ids', () => {
    const parsed = createThreadSchema.safeParse({
      collectorId: '01930000-0001-7000-8000-000000000002',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty collector id', () => {
    const parsed = createThreadSchema.safeParse({ collectorId: '' });
    expect(parsed.success).toBe(false);
  });
});
