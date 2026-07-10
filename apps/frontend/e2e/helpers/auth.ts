import { expect, type Page } from '@playwright/test';

export const DEMO_USERS = {
  superAdmin: {
    email: 'admin@wilms.demo',
    password: 'DemoAdmin1!',
    landingPath: /\/dashboard/,
  },
  collector: {
    email: 'collector@wilms.demo',
    password: 'DemoCollect1!',
    landingPath: /\/collector\/dashboard/,
  },
  officer: {
    email: 'officer@wilms.demo',
    password: 'DemoOfficer1!',
    landingPath: /\/officer\/register/,
  },
  approver: {
    email: 'approver@wilms.demo',
    password: 'DemoApprove1!',
    landingPath: /\/approver\/pending/,
  },
  auditor: {
    email: 'auditor@wilms.demo',
    password: 'DemoAudit1!',
    landingPath: /\/auditor\/reports/,
  },
} as const;

export async function waitForLoginForm(
  page: Page,
  options?: { navigate?: boolean },
): Promise<void> {
  if (options?.navigate !== false) {
    await page.goto('/login');
  }

  // LoginForm renders only after AppBootstrap finishes hydrating auth/theme/app-lock stores.
  await expect(page.locator('html[data-theme-store-ready="true"]')).toHaveAttribute(
    'data-theme-store-ready',
    'true',
    { timeout: 30_000 },
  );

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('form[data-login-ready="true"]')).toBeVisible({ timeout: 15_000 });
}

const E2E_APP_LOCK_PIN = '123456';

async function enterPinDigits(page: Page, pin: string): Promise<void> {
  for (const digit of pin.split('')) {
    await page.getByRole('button', { name: `Digit ${digit}` }).click();
  }
}

/** Mandatory app-lock gate blocks shell tests until a PIN is configured. */
async function completeMandatoryAppLockIfPresent(page: Page): Promise<void> {
  const setupHeading = page.getByRole('heading', { name: 'Set up app lock' });

  if (!(await setupHeading.isVisible({ timeout: 5_000 }).catch(() => false))) {
    return;
  }

  await page.getByRole('button', { name: 'Set up app lock' }).click();
  await enterPinDigits(page, E2E_APP_LOCK_PIN);
  await enterPinDigits(page, E2E_APP_LOCK_PIN);
  await expect(setupHeading).not.toBeVisible({ timeout: 15_000 });
}

export async function signIn(
  page: Page,
  credentials: { email: string; password: string },
  options?: { skipMandatoryAppLock?: boolean },
): Promise<void> {
  await waitForLoginForm(page);
  await page.locator('#login-email').fill(credentials.email);
  await page.locator('#login-password').fill(credentials.password);

  const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/login') && response.status() === 200,
    ),
    signInButton.click(),
  ]);

  await page.waitForURL(
    (url) => !url.searchParams.has('email') && !url.pathname.endsWith('/login'),
    { timeout: 15_000 },
  );

  if (!options?.skipMandatoryAppLock) {
    await completeMandatoryAppLockIfPresent(page);
  }
}
