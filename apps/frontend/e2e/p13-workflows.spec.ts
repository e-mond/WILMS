import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn } from './helpers/auth';

test.describe('P13 expanded workflows', () => {
  test('registration officer can open registration wizard', async ({ page }) => {
    await signIn(page, DEMO_USERS.officer);
    await expect(page).toHaveURL(DEMO_USERS.officer.landingPath);
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  test('approver can open pending application review', async ({ page }) => {
    await signIn(page, DEMO_USERS.approver);
    await expect(page).toHaveURL(DEMO_USERS.approver.landingPath);
    await expect(page.getByRole('heading', { name: 'Pending Applications' })).toBeAttached();
  });

  test('super admin can open groups directory and group profile', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/groups');
    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
    await expect(page.locator('table a[href^="/groups/"]').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('table a[href^="/groups/"]').first().click();
    await expect(page.getByRole('heading', { name: 'Group Information' })).toBeVisible();
  });

  test('collector can open payment entry from dashboard', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector);
    await expect(page).toHaveURL(DEMO_USERS.collector.landingPath);
    await page.goto('/collector/my-borrowers');
    await expect(page.getByRole('heading', { name: 'My Borrowers' })).toBeVisible();
  });

  test('collector can open expense form', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector);
    await page.goto('/collector/expenses');
    await expect(page.getByRole('heading', { name: 'Record Expense' })).toBeVisible();
    await expect(page.getByLabel('Category')).toBeVisible();
  });

  test('super admin can open reports hub', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
  });

  test('super admin can open user management settings', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/settings');
    await expect(page.getByRole('navigation', { name: 'Settings categories' })).toBeVisible();
    await page.getByRole('button', { name: 'User Management' }).click();
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  });

  test('super admin can open global search', async ({ page, isMobile }) => {
    await signIn(page, DEMO_USERS.superAdmin);

    if (isMobile) {
      await page.getByRole('button', { name: 'More actions' }).click();
      await page.getByRole('menuitem', { name: 'Search' }).click();
    } else {
      await page.getByRole('button', { name: /Search WILMS/i }).click();
    }

    const dialog = page.getByRole('dialog', { name: 'Search WILMS' });
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type="search"]').fill('GRP');
    await expect(dialog.getByText('Group').first()).toBeVisible();
  });
});
