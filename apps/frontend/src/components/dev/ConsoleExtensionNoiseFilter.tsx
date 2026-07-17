'use client';

import { useEffect } from 'react';

const EXTENSION_NOISE = /runtime\.lastError|message port closed|Extension context invalidated/i;

export function ConsoleExtensionNoiseFilter() {
  useEffect(() => {
    const originalError = console.error.bind(console);

    console.error = (...args: unknown[]) => {
      const combined = args.map((arg) => String(arg)).join(' ');
      if (EXTENSION_NOISE.test(combined)) {
        return;
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
