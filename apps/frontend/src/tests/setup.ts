import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

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
