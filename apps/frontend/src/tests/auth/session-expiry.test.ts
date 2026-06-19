import { describe, expect, it } from 'vitest';
import {
  buildSessionExpiredUrl,
  resolveLoginReturnUrl,
} from '@/lib/auth/session-expiry';

describe('session expiry urls', () => {
  it('builds a session-expired redirect with next path', () => {
    expect(buildSessionExpiredUrl('/collector/dashboard')).toBe(
      '/session-expired?next=%2Fcollector%2Fdashboard',
    );
  });

  it('omits next for public paths', () => {
    expect(buildSessionExpiredUrl('/login')).toBe('/session-expired');
  });

  it('builds login return url from session-expired next param', () => {
    expect(resolveLoginReturnUrl('/dashboard')).toBe('/login?next=%2Fdashboard');
  });
});
