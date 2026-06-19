import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn, waitForLoginForm } from './helpers/auth';

test.describe('authentication and theme', () => {
  test('login page uses design tokens in light and dark mode', async ({ page }) => {
    await waitForLoginForm(page);

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark', { timeout: 10_000 });
    await expect(html).toHaveClass(/dark/);
  });

  test('super admin can sign in and open mobile navigation', async ({ page, isMobile }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await expect(page).toHaveURL(DEMO_USERS.superAdmin.landingPath);

    if (isMobile) {
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Super Admin navigation' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Super Admin' })).toBeVisible();
    }
  });
});
