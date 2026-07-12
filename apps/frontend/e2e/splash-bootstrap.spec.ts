import { expect, test } from '@playwright/test';
import { waitForLoginForm } from './helpers/auth';

test.describe('splash and bootstrap', () => {
  test('login page loads after client bootstrap', async ({ page }) => {
    await waitForLoginForm(page);

    await expect(page.getByText('WILMS').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });
});
