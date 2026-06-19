import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn } from './helpers/auth';

test.describe('collector shell', () => {
  test('collector dashboard loads with bottom navigation on mobile', async ({ page, isMobile }) => {
    await signIn(page, DEMO_USERS.collector);
    await expect(page).toHaveURL(DEMO_USERS.collector.landingPath);

    if (isMobile) {
      await expect(page.getByRole('navigation', { name: 'Collector bottom navigation' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    }
  });
});
