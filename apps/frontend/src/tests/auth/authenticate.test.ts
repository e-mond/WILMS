import { describe, expect, it } from 'vitest';
import { authenticateMockCredentials } from '@/services/mock/authService.mock';
import { USER_ROLE } from '@/constants/roles';

describe('authenticateMockCredentials', () => {
  it('returns a session payload for valid demo credentials', () => {
    const payload = authenticateMockCredentials({
      email: 'collector@wilms.demo',
      password: 'DemoCollect1!',
    });

    expect(payload).toMatchObject({
      userId: 'user-collector',
      role: USER_ROLE.COLLECTOR,
      displayName: 'Field Collector',
    });
    expect(payload?.expiresAt).toBeGreaterThan(Date.now());
  });

  it('returns null for invalid credentials', () => {
    const payload = authenticateMockCredentials({
      email: 'collector@wilms.demo',
      password: 'wrong-password',
    });

    expect(payload).toBeNull();
  });
});
