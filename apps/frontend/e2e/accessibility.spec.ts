import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { waitForAxeReady } from './helpers/accessibility';
import { DEMO_USERS, signIn, waitForLoginForm } from './helpers/auth';

async function expectNoWcagViolations(
  page: import('@playwright/test').Page,
  context: string,
): Promise<void> {
  await waitForAxeReady(page);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(
    results.violations,
    `${context} accessibility violations:\n${JSON.stringify(results.violations, null, 2)}`,
  ).toEqual([]);
}

test.describe('WCAG 2.1 AA accessibility audit', () => {
  test.setTimeout(60_000);

  test('login page passes axe scan', async ({ page }) => {
    await waitForLoginForm(page);
    await expectNoWcagViolations(page, 'Login page');
  });

  test('collector dashboard passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.collector);
    await expect(page).toHaveURL(DEMO_USERS.collector.landingPath);
    await expect(page.getByText("Today's Collection")).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's Groups" })).toBeVisible();
    await expectNoWcagViolations(page, 'Collector dashboard');
  });

  test('approver pending queue passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.approver);
    await expect(page.getByRole('heading', { name: 'Pending Applications' })).toBeAttached();
    await expectNoWcagViolations(page, 'Approver pending queue');
  });

  test('super admin dashboard passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await expect(page.getByText('Total Pool Funds')).toBeVisible();
    await expectNoWcagViolations(page, 'Super admin dashboard');
  });

  test('super admin collectors page passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/collectors', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Collectors' })).toBeVisible();
    await expectNoWcagViolations(page, 'Super admin collectors');
  });

  test('super admin groups page passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/groups', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
    await expectNoWcagViolations(page, 'Super admin groups');
  });

  test('super admin loan pools page passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/loan-pools', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Loan Pools' })).toBeVisible();
    await expectNoWcagViolations(page, 'Super admin loan pools');
  });

  test('super admin risk flags page passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/risk-flags', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Open Flags', { exact: true }).first()).toBeVisible();
    await expectNoWcagViolations(page, 'Super admin risk flags');
  });

  test('super admin settings page passes axe scan', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Settings categories' })).toBeVisible();
    await expectNoWcagViolations(page, 'Super admin settings');
  });
});
