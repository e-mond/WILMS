import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn, waitForLoginForm } from './helpers/auth';

test.describe('login UX', () => {
  test('password visibility toggle works', async ({ page }) => {
    await waitForLoginForm(page);

    const password = page.locator('#login-password');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Toggle password visibility' }).click();
    await expect(password).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Toggle password visibility' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('remember email preference persists after reload', async ({ page }) => {
    await waitForLoginForm(page);
    await page.locator('#login-email').fill(DEMO_USERS.collector.email);
    await page.getByLabel('Remember my email on this device').check();
    await page.reload();
    await waitForLoginForm(page, { navigate: false });

    await expect(page.locator('#login-email')).toHaveValue(DEMO_USERS.collector.email);
    await expect(page.getByLabel('Remember my email on this device')).toBeChecked();
  });

  test('branded login header and theme toggle are visible', async ({ page }) => {
    await waitForLoginForm(page);

    await expect(page.getByText('WILMS').first()).toBeVisible();
    await expect(
      page.getByText("Women's Interest-Free Loan Management"),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Switch to (dark|light) mode/ })).toBeVisible();
  });

  test('successful sign in lands collector on dashboard', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector);
    await expect(page).toHaveURL(DEMO_USERS.collector.landingPath);
  });
});
