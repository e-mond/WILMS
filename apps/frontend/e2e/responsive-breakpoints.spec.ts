import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn, waitForLoginForm } from './helpers/auth';
import { expectOfficeShellAtBreakpoint } from './helpers/shell';

/** RC1 responsive matrix + P13.3 certification breakpoints. */
const BREAKPOINTS = [
  { label: 'mobile-320', width: 320, height: 568, mobileNav: true },
  { label: 'mobile-375', width: 375, height: 812, mobileNav: true },
  { label: 'mobile-390', width: 390, height: 844, mobileNav: true },
  { label: 'tablet-768', width: 768, height: 1024, mobileNav: false },
  { label: 'desktop-1024', width: 1024, height: 768, mobileNav: false },
  { label: 'desktop-1366', width: 1366, height: 768, mobileNav: false },
  { label: 'wide-1920', width: 1920, height: 1080, mobileNav: false },
] as const;

const OFFICE_ROLE_SHELLS = [
  {
    id: 'super-admin',
    user: DEMO_USERS.superAdmin,
    roleLabel: 'Super Admin',
    navAriaLabel: 'Super Admin',
    primaryNavLink: 'Dashboard',
    assertLanding: async (page: import('@playwright/test').Page) => {
      await expect(page.getByRole('heading', { name: 'Borrower Status' })).toBeVisible();
    },
  },
  {
    id: 'registration-officer',
    user: DEMO_USERS.officer,
    roleLabel: 'Registration Officer',
    navAriaLabel: 'Registration Officer',
    primaryNavLink: 'Register Borrower',
    operationalMobileNav: true,
    assertLanding: async (page: import('@playwright/test').Page) => {
      await expect(page.getByLabel('Full name')).toBeVisible();
    },
  },
  {
    id: 'approver',
    user: DEMO_USERS.approver,
    roleLabel: 'Approver',
    navAriaLabel: 'Approver Navigation',
    primaryNavLink: 'Pending Queue',
    operationalMobileNav: true,
    assertLanding: async (page: import('@playwright/test').Page) => {
      await expect(page.getByRole('heading', { name: 'Pending Applications' })).toBeAttached();
    },
  },
] as const;

for (const breakpoint of BREAKPOINTS) {
  test.describe(`responsive shell @ ${breakpoint.label}`, () => {
    test.use({ viewport: { width: breakpoint.width, height: breakpoint.height } });

    test('login page is usable', async ({ page }) => {
      await waitForLoginForm(page);
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
      await expect(page.getByText('WILMS').first()).toBeVisible();
    });

    test('collector navigation matches breakpoint', async ({ page }) => {
      await signIn(page, DEMO_USERS.collector);
      await expect(page).toHaveURL(DEMO_USERS.collector.landingPath);

      if (breakpoint.width < 768) {
        await expect(
          page.getByRole('navigation', { name: 'Collector bottom navigation' }),
        ).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
      } else {
        await expect(
          page.getByRole('navigation', { name: 'Collector Navigation' }).first(),
        ).toBeVisible();
        await expect(
          page.getByRole('link', { name: 'Dashboard', exact: true }).first(),
        ).toBeVisible();
      }
    });

    for (const roleShell of OFFICE_ROLE_SHELLS) {
      test(`${roleShell.id} office shell matches breakpoint`, async ({ page }) => {
        await signIn(page, roleShell.user);
        await expect(page).toHaveURL(roleShell.user.landingPath);
        await roleShell.assertLanding(page);

        await expectOfficeShellAtBreakpoint(
          page,
          {
            roleLabel: roleShell.roleLabel,
            navAriaLabel: roleShell.navAriaLabel,
            primaryNavLink: roleShell.primaryNavLink,
            operationalMobileNav: 'operationalMobileNav' in roleShell ? roleShell.operationalMobileNav : undefined,
          },
          { mobileNav: breakpoint.mobileNav },
        );
      });
    }
  });
}
