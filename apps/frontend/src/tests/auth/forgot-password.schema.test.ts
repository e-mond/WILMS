import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema } from '@/features/authentication/forgot-password.schema';

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('requires a non-empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Email is required.');
  });

  it('rejects invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Enter a valid email address.');
  });
});
