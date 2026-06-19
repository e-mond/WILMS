import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f6e56' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};
