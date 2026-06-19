import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn, waitForLoginForm } from './helpers/auth';

test.describe('logout', () => {
  test('collector log out returns to login and blocks protected routes', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector);
    await expect(page).toHaveURL(DEMO_USERS.collector.landingPath);

    await page.getByRole('button', { name: 'Field Collector' }).click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/logout') && response.status() === 200,
      ),
      page.getByRole('menu', { name: 'User menu' }).getByRole('button', { name: 'Log out' }).click(),
    ]);

    await expect(page).toHaveURL(/\/login$/);
    await waitForLoginForm(page, { navigate: false });

    await page.goto('/collector/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('super admin log out clears session', async ({ page, isMobile }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await expect(page).toHaveURL(DEMO_USERS.superAdmin.landingPath);

    if (isMobile) {
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
    }

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
