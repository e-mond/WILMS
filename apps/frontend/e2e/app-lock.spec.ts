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
      (
        window as Window & { __WILMS_E2E_APP_LOCK_POST_LOGIN_GRACE_MS?: number }
      ).__WILMS_E2E_APP_LOCK_POST_LOGIN_GRACE_MS = 0;
    });
  });

  test('collector can enable pin and unlock after idle lock', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector, { skipMandatoryAppLock: true });

    await page.goto('/collector/settings');
    await page.getByRole('button', { name: 'App Lock' }).click();
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

  test('shows lockout warning after repeated failed pin attempts', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector, { skipMandatoryAppLock: true });

    await page.goto('/collector/settings');
    await page.getByRole('button', { name: 'App Lock' }).click();
    await page.getByRole('button', { name: 'Set up app lock' }).click();
    await enterPin(page, '123456');
    await enterPin(page, '123456');

    await page.goto('/collector/dashboard');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Field Collector/i)).toBeVisible();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await enterPin(page, '000000');
      await expect(page.getByRole('dialog').getByText(/Incorrect PIN/i)).toBeVisible({
        timeout: 10_000,
      });
    }

    await expect(page.getByText(/attempts left before sign-out/i)).toBeVisible();
  });

  test('remains locked after page refresh', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector, { skipMandatoryAppLock: true });

    await page.goto('/collector/settings');
    await page.getByRole('button', { name: 'App Lock' }).click();
    await page.getByRole('button', { name: 'Set up app lock' }).click();
    await enterPin(page, '654321');
    await enterPin(page, '654321');

    await page.goto('/collector/dashboard');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await enterPin(page, '654321');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).not.toBeVisible();
  });
});
