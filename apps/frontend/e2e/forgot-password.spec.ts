import { expect, test } from '@playwright/test';
import { waitForLoginForm } from './helpers/auth';

test.describe('Forgot password flow', () => {
  test('shows branded recovery page with trust indicators', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
    await expect(page.getByText('Secure password recovery')).toBeVisible();
    await expect(page.getByRole('img', { name: 'WILMS' })).toBeVisible();
    await expect(page.getByText("Women's Interest-Free Loan Management")).toBeVisible();
    await expect(
      page.getByText('Helping women grow through interest-free financing.'),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to Sign In' })).toBeVisible();
  });

  test('validates email before submit', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('#forgot-password-email')).toBeVisible();
    await page.locator('#forgot-password-email').fill('');

    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    await expect(page.locator('#forgot-password-email-error')).toHaveText(/Email is required|Enter a valid email address/);
  });

  test('submits reset request and shows enumeration-safe success state', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.locator('#forgot-password-email').fill('collector@wilms.demo');
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText("If an account exists for this email, we've sent a password reset link."),
    ).toBeVisible();
  });

  test('supports keyboard submission', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.locator('#forgot-password-email').fill('admin@wilms.demo');
    await page.locator('#forgot-password-email').press('Enter');

    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('navigates back to sign in', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByRole('link', { name: 'Back to Sign In' }).click();
    await waitForLoginForm(page, { navigate: false });
  });
});
