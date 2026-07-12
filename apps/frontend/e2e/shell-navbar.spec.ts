import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn } from './helpers/auth';
import {
  expectAppAsideLandmark,
  expectShellAsideDrawerAccess,
  expectSidebarCollapseToggle,
} from './helpers/shell';

test.describe('shell navbar and layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('super admin sidebar collapse toggle updates landmark state', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);
    await expect(page).toHaveURL(DEMO_USERS.superAdmin.landingPath);

    await expectSidebarCollapseToggle(page, { collapsed: false });
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expectSidebarCollapseToggle(page, { collapsed: true });
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
    await expectSidebarCollapseToggle(page, { collapsed: false });
  });

  test('super admin exposes app-aside landmark at xl breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 900 });
    await signIn(page, DEMO_USERS.superAdmin);
    await expectAppAsideLandmark(page);
  });

  test('super admin laptop layout keeps collapsible sidebar and persistent aside', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, DEMO_USERS.superAdmin);
    await expect(page.getByText('Total Pool Funds')).toBeVisible();
    await expectSidebarCollapseToggle(page, { collapsed: false });
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expectSidebarCollapseToggle(page, { collapsed: true });
    await expectAppAsideLandmark(page);
    await expect(page.getByRole('heading', { name: 'Recent Alerts' })).toBeVisible();
  });

  test('super admin global search opens and returns borrower results', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);

    await page.getByRole('button', { name: /Search WILMS/i }).click();
    const dialog = page.getByRole('dialog', { name: 'Search WILMS' });
    await expect(dialog).toBeVisible();

    await dialog.locator('input[type="search"]').fill('Ama');
    await expect(dialog.getByRole('link', { name: /Ama/i }).first()).toBeVisible();
  });

  test('super admin notification inbox opens with unread items', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);

    await page.getByRole('button', { name: /Open notifications/i }).click();
    const drawer = page.getByRole('dialog', { name: 'Notifications' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Variance review required')).toBeVisible();
  });

  test('super admin dashboard shows reference breadcrumbs and title', async ({ page }) => {
    await signIn(page, DEMO_USERS.superAdmin);

    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Home');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Overview');
    await expect(page.getByRole('heading', { name: 'Borrower Status' })).toBeVisible();
    await expect(page.locator('[data-navbar="app"] [data-live-badge="true"]')).toHaveCount(0);
  });

  test('super admin mobile exposes context panel drawer for alerts', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await expect(page.getByText('Total Pool Funds')).toBeVisible();
    await expectShellAsideDrawerAccess(page);
    await expect(page.getByRole('heading', { name: 'Recent Alerts' })).toBeVisible();
  });

  test('collectors page mobile exposes context panel drawer for aside content', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/collectors', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Collectors' })).toBeVisible();
    await expect(page.getByText('Total Collectors')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Collectors' })).toBeVisible();
    await expectShellAsideDrawerAccess(page);
    await expect(page.getByRole('heading', { name: 'Team Rate Distribution' })).toBeVisible();
  });

  test('collectors page laptop layout keeps persistent app-aside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/collectors');
    await expect(page.getByText('Total Collectors')).toBeVisible();
    await expectAppAsideLandmark(page);
    await expect(page.getByRole('heading', { name: 'Collector Alerts' })).toBeVisible();
  });

  test('groups page mobile exposes context panel drawer for aside content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/groups');
    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
    await expect(page.getByText('Active Groups')).toBeVisible();
    await expectShellAsideDrawerAccess(page);
    await expect(page.getByRole('heading', { name: 'Risk Distribution' })).toBeVisible();
  });

  test('groups page laptop layout keeps persistent app-aside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/groups');
    await expect(page.getByText('Active Groups')).toBeVisible();
    await expectAppAsideLandmark(page);
    await expect(page.getByRole('heading', { name: 'Recent Group Activity' })).toBeVisible();
  });

  test('loan pools page mobile exposes context panel drawer for aside content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/loan-pools');
    await expect(page.getByRole('heading', { name: 'Loan Pools' })).toBeVisible();
    await expect(page.getByText('Total Pool Funds')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Loan pools' })).toBeVisible();
    await expectShellAsideDrawerAccess(page);
    await expect(page.getByRole('heading', { name: 'Fund Allocation by Pool' })).toBeVisible();
  });

  test('loan pools page laptop layout keeps persistent app-aside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/loan-pools');
    await expect(page.getByText('Total Pool Funds')).toBeVisible();
    await expectAppAsideLandmark(page);
    await expect(page.getByRole('heading', { name: 'Recent Pool Activity' })).toBeVisible();
  });

  test('risk flags page mobile exposes context panel drawer for aside content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/risk-flags');
    await expect(page.getByText('Open Flags', { exact: true }).first()).toBeVisible();
    await expectShellAsideDrawerAccess(page);
    await expect(page.getByRole('heading', { name: 'Active Alerts' })).toBeVisible();
  });

  test('risk flags page laptop layout keeps persistent app-aside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/risk-flags');
    await expect(page.getByText('Open Flags', { exact: true }).first()).toBeVisible();
    await expectAppAsideLandmark(page);
    await expect(page.getByRole('heading', { name: 'Flag Type Breakdown' })).toBeVisible();
  });

  test('settings page mobile exposes context panel drawer for aside content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'System Settings', level: 1 })).toBeVisible();
    await expectShellAsideDrawerAccess(page);
    await expect(page.getByRole('heading', { name: 'System Status' })).toBeVisible();
  });

  test('settings page laptop layout keeps persistent app-aside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/settings');
    await expect(page.getByRole('navigation', { name: 'Settings categories' })).toBeVisible();
    await expectAppAsideLandmark(page);
    await expect(page.getByRole('heading', { name: 'Recent Changes' })).toBeVisible();
  });

  test('reports page mobile exposes context panel drawer for aside content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
    await expect(page.getByText('Total Collections')).toBeVisible({ timeout: 15_000 });
    await expectShellAsideDrawerAccess(page);
    await expect(page.getByRole('heading', { name: 'Report Categories' })).toBeVisible();
  });

  test('reports page laptop layout keeps persistent app-aside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/reports');
    await expect(page.getByText('Recovery Rate')).toBeVisible();
    await expectAppAsideLandmark(page);
    await expect(page.getByRole('heading', { name: 'Scheduled Reports' })).toBeVisible();
  });

  test('settings page mobile shows scrollable category navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, DEMO_USERS.superAdmin);
    await page.goto('/settings');
    const nav = page.getByRole('navigation', { name: 'Settings categories' });
    await expect(nav.getByRole('button', { name: 'Security & Access' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Audit & Logs' })).toBeVisible();
  });

  test('collector navbar shows connection status chip', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Collector AppNavbar is visible from md breakpoint only');

    await signIn(page, DEMO_USERS.collector);
    await expect(page.locator('[data-navbar="app"]')).toBeVisible();
    await expect(page.getByRole('status', { name: 'Online' })).toBeVisible();
  });
});
