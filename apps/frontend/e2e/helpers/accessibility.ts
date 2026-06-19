import { expect, type Page } from '@playwright/test';

/** Wait for client bootstrap before axe scans to reduce theme/hydration flakiness. */
export async function waitForAxeReady(page: Page): Promise<void> {
  await expect(page.locator('html[data-theme-store-ready="true"]')).toHaveAttribute(
    'data-theme-store-ready',
    'true',
    { timeout: 30_000 },
  );
}
