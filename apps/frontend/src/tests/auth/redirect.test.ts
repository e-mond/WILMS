import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import { resolveSafeRedirect } from '@/lib/auth/redirect';

describe('resolveSafeRedirect', () => {
  it('returns the next path when it is an internal protected route', () => {
    expect(resolveSafeRedirect('/collector/dashboard', USER_ROLE.COLLECTOR)).toBe(
      '/collector/dashboard',
    );
  });

  it('falls back to the role home path when next is missing', () => {
    expect(resolveSafeRedirect(null, USER_ROLE.APPROVER)).toBe('/approver/pending');
  });

  it('rejects external and public redirect targets', () => {
    expect(resolveSafeRedirect('//evil.example', USER_ROLE.SUPER_ADMIN)).toBe('/dashboard');
    expect(resolveSafeRedirect('/login', USER_ROLE.SUPER_ADMIN)).toBe('/dashboard');
  });
});
