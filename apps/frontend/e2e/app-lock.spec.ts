import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn } from './helpers/auth';

async function enterPin(page: import('@playwright/test').Page, pin: string): Promise<void> {
  for (const digit of pin.split('')) {
    await page.getByRole('button', { name: `Digit ${digit}` }).click();
  }
}

test.describe('app lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __WILMS_E2E_APP_LOCK_IDLE_MS?: number }).__WILMS_E2E_APP_LOCK_IDLE_MS =
        2_000;
    });
  });

  test('collector can enable pin and unlock after idle lock', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector, { skipMandatoryAppLock: true });

    await page.goto('/collector/security');
    await expect(page.getByRole('heading', { name: 'App lock', level: 2 })).toBeVisible();

    await page.getByRole('button', { name: 'Set up app lock' }).click();
    await enterPin(page, '123456');
    await enterPin(page, '123456');
    await expect(page.getByText('Enabled on this device')).toBeVisible();

    await page.goto('/collector/dashboard');
    await expect(page.getByRole('heading', { name: "Today's Groups" })).toBeVisible();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await enterPin(page, '123456');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).not.toBeVisible();
  });
});
