import { expect, test } from '@playwright/test';

test.describe('session expired', () => {
  test('shows re-login guidance with token styling', async ({ page }) => {
    await page.goto('/session-expired');

    await expect(page.getByRole('heading', { name: 'Session expired' })).toBeVisible();
    await expect(
      page.getByRole('alert').filter({ hasText: 'You have been signed out' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Return to sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  test('preserves safe return path in login link', async ({ page }) => {
    await page.goto('/session-expired?next=%2Fcollector%2Fdashboard');

    await expect(page.getByRole('link', { name: 'Return to sign in' })).toHaveAttribute(
      'href',
      '/login?next=%2Fcollector%2Fdashboard',
    );
  });
});
