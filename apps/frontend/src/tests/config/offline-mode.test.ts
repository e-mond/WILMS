import { afterEach, describe, expect, it, vi } from 'vitest';
import { isOfflineModeEnabled } from '@/config/offline-mode';

describe('isOfflineModeEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to false when unset (production parity)', () => {
    expect(isOfflineModeEnabled(undefined)).toBe(false);
    expect(isOfflineModeEnabled('')).toBe(false);
  });

  it('enables only for explicit truthy values', () => {
    expect(isOfflineModeEnabled('true')).toBe(true);
    expect(isOfflineModeEnabled('1')).toBe(true);
    expect(isOfflineModeEnabled('yes')).toBe(true);
    expect(isOfflineModeEnabled('on')).toBe(true);
  });

  it('stays disabled for explicit falsey values', () => {
    expect(isOfflineModeEnabled('false')).toBe(false);
    expect(isOfflineModeEnabled('0')).toBe(false);
    expect(isOfflineModeEnabled('off')).toBe(false);
  });
});
