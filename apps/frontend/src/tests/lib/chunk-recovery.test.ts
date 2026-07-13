import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { attemptChunkRecovery, isChunkLoadError } from '@/lib/chunk-recovery';

describe('chunk-recovery', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('location', { reload: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects ChunkLoadError by name', () => {
    expect(isChunkLoadError(new Error('missing file'))).toBe(false);
    const error = new Error('Loading chunk 123 failed');
    error.name = 'ChunkLoadError';
    expect(isChunkLoadError(error)).toBe(true);
  });

  it('detects dynamic import failures', () => {
    expect(
      isChunkLoadError(new Error('Failed to fetch dynamically imported module: /_next/static/chunk.js')),
    ).toBe(true);
  });

  it('reloads only once per session', () => {
    expect(attemptChunkRecovery()).toBe(true);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(attemptChunkRecovery()).toBe(false);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
