import { describe, expect, it } from 'vitest';
import { resolveWilmsProxyUpstreamPath } from '@/lib/api/upstream-path';

describe('resolveWilmsProxyUpstreamPath', () => {
  it('maps health checks to /health', () => {
    expect(resolveWilmsProxyUpstreamPath('health')).toBe('/health');
    expect(resolveWilmsProxyUpstreamPath('health', '?verbose=1')).toBe('/health?verbose=1');
  });

  it('maps auth routes to /auth/* without /api/v1 prefix', () => {
    expect(resolveWilmsProxyUpstreamPath('auth/forgot-password')).toBe('/auth/forgot-password');
    expect(resolveWilmsProxyUpstreamPath('auth/reset-password')).toBe('/auth/reset-password');
  });

  it('maps business routes to /api/v1/*', () => {
    expect(resolveWilmsProxyUpstreamPath('borrowers')).toBe('/api/v1/borrowers');
    expect(resolveWilmsProxyUpstreamPath('settings/users', '?page=1')).toBe(
      '/api/v1/settings/users?page=1',
    );
  });
});
