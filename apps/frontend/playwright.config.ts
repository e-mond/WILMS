import { defineConfig, devices } from '@playwright/test';

const E2E_HOST = process.env.PLAYWRIGHT_HOST ?? process.env.E2E_HOST ?? '127.0.0.1';
const FRONTEND_PORT =
  process.env.PLAYWRIGHT_PORT ??
  process.env.FRONTEND_PORT ??
  process.env.E2E_PORT ??
  '3000';
const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://${E2E_HOST}:${FRONTEND_PORT}`;

/**
 * Both projects use Chromium so only `npx playwright install chromium` is required.
 * Mobile uses an iPhone 12 viewport + touch/UA — not WebKit — for reliable Windows CI/dev.
 * Ports and URLs are env-driven (see apps/frontend/.env.example).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- --hostname ${E2E_HOST} --port ${FRONTEND_PORT}`,
    url: `${PLAYWRIGHT_BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_APP_LOCK_IDLE_MS: process.env.NEXT_PUBLIC_APP_LOCK_IDLE_MS ?? '3600000',
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent: devices['iPhone 12'].userAgent,
      },
    },
  ],
});
