import { expect, test } from '@playwright/test';
import { waitForLoginForm } from './helpers/auth';

test.describe('toast feedback', () => {
  test('success toast renders with dismiss control', async ({ page }) => {
    await waitForLoginForm(page);

    await page.evaluate(() => {
      window.__wilmsE2E?.showSuccessToast(
        'Borrower approved',
        'The application has been approved.',
      );
    });

    await expect(page.getByText('Borrower approved')).toBeVisible();
    await expect(page.getByText('The application has been approved.')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Dismiss Borrower approved notification' }),
    ).toBeVisible();
  });
});
