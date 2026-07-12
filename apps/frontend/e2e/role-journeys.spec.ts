import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn } from './helpers/auth';

test.describe('role landing journeys', () => {
  test('registration officer reaches borrower registration', async ({ page, isMobile }) => {
    await signIn(page, DEMO_USERS.officer);
    await expect(page).toHaveURL(DEMO_USERS.officer.landingPath);
    await expect(page.getByLabel('Full name')).toBeVisible();

    if (isMobile) {
      await expect(
        page.getByRole('navigation', { name: 'Registration Officer bottom navigation' }),
      ).toBeVisible();
    }
  });

  test('approver reaches pending applications queue', async ({ page, isMobile }) => {
    await signIn(page, DEMO_USERS.approver);
    await expect(page).toHaveURL(DEMO_USERS.approver.landingPath);

    if (isMobile) {
      await expect(
        page.getByRole('navigation', { name: 'Approver Navigation bottom navigation' }),
      ).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Pending Queue', exact: true })).toBeVisible();
    } else {
      await expect(page.getByRole('link', { name: 'Pending Queue' })).toBeVisible();
    }
  });

  test('super admin reaches executive dashboard', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await expect(page).toHaveURL(DEMO_USERS.superAdmin.landingPath);
    await expect(page.getByRole('heading', { name: 'Borrower Status' })).toBeVisible();
  });

  test('auditor reaches reports hub', async ({ page }) => {
    await signIn(page, DEMO_USERS.auditor);
    await expect(page).toHaveURL(DEMO_USERS.auditor.landingPath);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Reports');
    await expect(page.getByText('Read-only operational and compliance reports.')).toBeVisible();
  });
});
