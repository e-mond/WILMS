import { expect, test } from '@playwright/test';
import { waitForLoginForm } from './helpers/auth';

test.describe('PWA installability', () => {
  test('manifest is linked and valid', async ({ page }) => {
    await waitForLoginForm(page);

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest');

    const response = await page.request.get('/manifest.webmanifest');
    expect(response.ok()).toBeTruthy();

    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      icons: Array<{ src: string; sizes: string }>;
    };

    expect(manifest.name).toContain('WILMS');
    expect(manifest.short_name).toBe('WILMS');
    expect(manifest.start_url).toBe('/login');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('service worker registers on load', async ({ page }) => {
    await waitForLoginForm(page);

    await expect
      .poll(
        async () => {
          return page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) {
              return false;
            }

            const registration = await navigator.serviceWorker.getRegistration('/');
            return Boolean(registration?.active ?? registration?.installing);
          });
        },
        { timeout: 15_000 },
      )
      .toBe(true);
  });

  test('PWA icons are served', async ({ page }) => {
    const icon192 = await page.request.get('/icons/icon-192.png');
    const icon512 = await page.request.get('/icons/icon-512.png');

    expect(icon192.ok()).toBeTruthy();
    expect(icon512.ok()).toBeTruthy();
  });

  test('apple mobile web app meta is present', async ({ page }) => {
    await waitForLoginForm(page);

    const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleCapable).toHaveAttribute('content', 'yes');
  });

  test('manifest includes maskable icon purpose', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const manifest = (await response.json()) as {
      icons: Array<{ purpose?: string }>;
    };

    const hasMaskable = manifest.icons.some((icon) => icon.purpose?.includes('maskable'));
    expect(hasMaskable).toBeTruthy();
  });
});
