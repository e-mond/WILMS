import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const tourSource = readFileSync(
  join(process.cwd(), 'src/components/onboarding/ProductTourOverlay.tsx'),
  'utf8',
);

describe('product tour routes', () => {
  it('does not point Super Admin expenses to the removed settings path', () => {
    expect(tourSource).not.toContain("href: '/settings/expenses'");
    expect(tourSource).toContain("href: '/expenses'");
  });

  it('uses role-scoped paths for officer and auditor tours', () => {
    expect(tourSource).toContain("href: '/officer/register'");
    expect(tourSource).toContain("href: '/officer/my-registrations'");
    expect(tourSource).toContain("href: '/auditor/audit-log'");
    expect(tourSource).toContain("href: '/auditor/reports'");
  });

  it('supports resume-later progress and analytics keys', () => {
    expect(tourSource).toContain('wilms-product-tour-progress');
    expect(tourSource).toContain('Resume later');
    expect(tourSource).toContain('tour_paused');
  });
});
