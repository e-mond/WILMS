import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

expect.extend(matchers);

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'print', {
    configurable: true,
    value: () => undefined,
  });
  window.focus = () => undefined;
}

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});
