import { describe, expect, it } from 'vitest';
import { loginSchema } from '@/features/authentication/login.schema';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'admin@wilms.demo',
      password: 'DemoAdmin1!',
    });

    expect(result.success).toBe(true);
  });

  it('requires a valid email address', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'DemoAdmin1!',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Enter a valid email address.');
  });

  it('requires a password with at least 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'admin@wilms.demo',
      password: 'short',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Password must be at least 8 characters.');
  });
});
