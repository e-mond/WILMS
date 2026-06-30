import { expect, test } from '@playwright/test';
import { DEMO_USERS, signIn } from './helpers/auth';

const ROLE_JOURNEYS = [
  {
    role: 'super-admin',
    user: DEMO_USERS.superAdmin,
    paths: ['/dashboard', '/borrowers', '/loans', '/loan-pools', '/reports/daily-collection', '/settings'],
  },
  {
    role: 'approver',
    user: DEMO_USERS.approver,
    paths: ['/approver/pending', '/approver/disbursement'],
  },
  {
    role: 'registration-officer',
    user: DEMO_USERS.officer,
    paths: ['/registration/register', '/registration/borrowers'],
  },
  {
    role: 'collector',
    user: DEMO_USERS.collector,
    paths: ['/collector/dashboard', '/collector/collections'],
  },
] as const;

for (const journey of ROLE_JOURNEYS) {
  test.describe(`RC1 functional audit — ${journey.role}`, () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page, journey.user);
    });

    for (const path of journey.paths) {
      test(`loads ${path} without console errors`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') {
            consoleErrors.push(message.text());
          }
        });

        const failedRequests: string[] = [];
        page.on('requestfailed', (request) => {
          failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'failed'}`);
        });

        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const decodingFailures = failedRequests.filter((entry) =>
          entry.includes('ERR_CONTENT_DECODING_FAILED'),
        );
        expect(decodingFailures, decodingFailures.join('\n')).toHaveLength(0);

        const criticalErrors = consoleErrors.filter(
          (entry) =>
            !entry.includes('favicon') &&
            !entry.includes('ResizeObserver') &&
            !entry.includes('401'),
        );
        expect(criticalErrors, criticalErrors.join('\n')).toHaveLength(0);
      });
    }
  });
}
