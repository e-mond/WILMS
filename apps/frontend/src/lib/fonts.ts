import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';

/**
 * Self-hosted via next/font (fonts downloaded at build time).
 * No runtime requests to fonts.googleapis.com / fonts.gstatic.com — CSP-safe.
 */
export const fontSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-wilms-sans',
  display: 'swap',
  fallback: ['IBM Plex Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
});

export const fontSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-wilms-serif',
  display: 'swap',
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
});
