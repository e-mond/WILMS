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

  it('requires a non-empty password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@wilms.demo',
      password: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Password is required.');
  });

  it('accepts short invite passwords for server-side validation', () => {
    const result = loginSchema.safeParse({
      email: 'invited@wilms.demo',
      password: 'short',
    });

    expect(result.success).toBe(true);
  });
});
