import { describe, expect, it } from 'vitest';
import { appLockPinSchema, setAppLockPinSchema } from '@/features/app-lock/app-lock.schema';

describe('app-lock.schema', () => {
  it('requires six digits', () => {
    expect(appLockPinSchema.safeParse('12345').success).toBe(false);
    expect(appLockPinSchema.safeParse('123456').success).toBe(true);
  });

  it('requires matching confirmation', () => {
    expect(
      setAppLockPinSchema.safeParse({ pin: '123456', confirmPin: '654321' }).success,
    ).toBe(false);
    expect(
      setAppLockPinSchema.safeParse({ pin: '123456', confirmPin: '123456' }).success,
    ).toBe(true);
  });
});
