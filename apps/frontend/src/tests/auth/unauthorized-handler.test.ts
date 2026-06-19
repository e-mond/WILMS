import { describe, expect, it, vi } from 'vitest';
import {
  setUnauthorizedHandler,
  triggerUnauthorizedHandler,
} from '@/lib/auth/unauthorized-handler';

describe('unauthorized handler', () => {
  it('invokes the registered handler', () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    triggerUnauthorizedHandler();

    expect(handler).toHaveBeenCalledTimes(1);
    setUnauthorizedHandler(null);
  });
});
