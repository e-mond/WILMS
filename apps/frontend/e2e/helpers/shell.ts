import { expect, type Page } from '@playwright/test';

export interface OfficeShellExpectations {
  roleLabel: string;
  navAriaLabel: string;
  primaryNavLink: string;
  /** Roles that use bottom tab navigation instead of a sidebar drawer on mobile. */
  operationalMobileNav?: boolean;
}

export async function expectOfficeShellAtBreakpoint(
  page: Page,
  expectations: OfficeShellExpectations,
  options: { mobileNav: boolean },
): Promise<void> {
  const { roleLabel, navAriaLabel, primaryNavLink, operationalMobileNav } = expectations;

  if (options.mobileNav) {
    if (operationalMobileNav) {
      const bottomNav = page.getByRole('navigation', {
        name: `${navAriaLabel} bottom navigation`,
      });
      await expect(bottomNav).toBeVisible();
      await expect(
        bottomNav.getByRole('tab', { name: primaryNavLink, exact: true }),
      ).toBeVisible();
      return;
    }

    const navTrigger = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(navTrigger).toBeVisible();
    await navTrigger.click();

    const drawer = page.getByRole('dialog', { name: `${roleLabel} navigation` });
    await expect(drawer).toBeVisible();
    await expect(withinDrawer(drawer, navAriaLabel, primaryNavLink)).toBeVisible();
    return;
  }

  const sidebarNav = page.getByRole('navigation', { name: navAriaLabel }).first();
  await expect(sidebarNav).toBeVisible();
  await expect(
    sidebarNav.getByRole('link', { name: primaryNavLink, exact: true }),
  ).toBeVisible();
}

function withinDrawer(
  drawer: ReturnType<Page['getByRole']>,
  navAriaLabel: string,
  primaryNavLink: string,
) {
  return drawer
    .getByRole('navigation', { name: navAriaLabel })
    .getByRole('link', { name: primaryNavLink, exact: true });
}

export async function expectSidebarCollapseToggle(
  page: Page,
  options: { collapsed: boolean },
): Promise<void> {
  const sidebar = page.locator('aside[data-sidebar]').first();
  await expect(sidebar).toBeVisible();

  if (options.collapsed) {
    await expect(sidebar).toHaveAttribute('data-sidebar-collapsed', 'true');
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    return;
  }

  await expect(sidebar).not.toHaveAttribute('data-sidebar-collapsed', 'true');
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
}

export async function expectAppAsideLandmark(page: Page): Promise<void> {
  const aside = page.locator('#app-aside');
  await expect(aside).toBeVisible();
  await expect(aside).toHaveAttribute('aria-label', 'Context panel');
}

export async function expectShellAsideDrawerAccess(page: Page): Promise<void> {
  const trigger = page.getByRole('button', { name: 'Open context panel' });
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeVisible();
  await trigger.click({ force: true });
  const drawer = page.getByRole('dialog', { name: 'Context panel' });
  await expect(drawer).toBeVisible({ timeout: 15_000 });
}
