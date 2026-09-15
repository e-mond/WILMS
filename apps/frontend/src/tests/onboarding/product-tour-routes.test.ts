import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { USER_ROLE } from '@/constants/roles';
import {
  TOUR_TRACK_CORE,
  getNavItemsForRole,
  getRoleStarterSteps,
  getTourStepsForTrack,
  isTourHrefAllowed,
  listTourHrefs,
} from '@/components/onboarding/tour-catalog';

const tourOverlaySource = readFileSync(
  join(process.cwd(), 'src/components/onboarding/ProductTourOverlay.tsx'),
  'utf8',
);
const tourCatalogSource = readFileSync(
  join(process.cwd(), 'src/components/onboarding/tour-catalog.ts'),
  'utf8',
);
const helpFabSource = readFileSync(
  join(process.cwd(), 'src/components/onboarding/HelpFab.tsx'),
  'utf8',
);

describe('product tour routes', () => {
  it('does not point Super Admin expenses to the removed settings path', () => {
    expect(tourCatalogSource).not.toContain("href: '/settings/expenses'");
    expect(tourCatalogSource).toContain("href: '/expenses'");
  });

  it('uses role-scoped paths for officer and auditor tours', () => {
    expect(tourCatalogSource).toContain("href: '/officer/register'");
    expect(tourCatalogSource).toContain("href: '/officer/my-registrations'");
    expect(tourCatalogSource).toContain("href: '/auditor/audit-log'");
    expect(tourCatalogSource).toContain("href: '/auditor/reports'");
  });

  it('supports resume-later progress and analytics keys', () => {
    expect(tourOverlaySource).toContain('wilms-product-tour-progress');
    expect(tourOverlaySource).toContain('Pause saves progress');
    expect(tourOverlaySource).toContain('tour_paused');
    expect(tourOverlaySource).toContain('tour_chapter_jump');
  });

  it('offers welcome actions including do-not-show-again', () => {
    expect(tourOverlaySource).toContain('Welcome to WILMS');
    expect(tourOverlaySource).toContain("Don&apos;t show again");
    expect(tourOverlaySource).toContain('Not now');
    expect(tourOverlaySource).toContain('Start tour');
    expect(tourOverlaySource).toContain('neverShowAgain: true');
  });

  it('distinguishes Operations Overview from platform Operations', () => {
    expect(tourCatalogSource).toContain("href: '/dashboard'");
    expect(tourCatalogSource).toContain("href: '/ops'");
    expect(tourCatalogSource).toContain('separate from Operations Overview and Portfolio Health');
  });

  it('covers newly integrated Super Admin surfaces', () => {
    expect(tourCatalogSource).toContain("href: '/executive'");
    expect(tourCatalogSource).toContain("href: '/records'");
    expect(tourCatalogSource).toContain("href: '/adjustments'");
    expect(tourCatalogSource).toContain("href: '/settings?section=loan-rules'");
    expect(tourCatalogSource).toContain("href: '/borrowers?status=PENDING'");
  });

  it('covers role account and records paths', () => {
    expect(tourCatalogSource).toContain("href: '/collector/settings'");
    expect(tourCatalogSource).toContain("href: '/officer/records'");
    expect(tourCatalogSource).toContain("href: '/approver/schedule-changes'");
    expect(tourCatalogSource).toContain("href: '/auditor/records'");
  });

  it('does not tour the removed collector Messages inbox', () => {
    expect(tourCatalogSource).not.toContain("href: '/collector/messages'");
    expect(tourCatalogSource).not.toContain('data-tour-nav="/collector/messages"');
  });

  it('keeps Super Admin first-run core tour short', () => {
    const coreSteps = getTourStepsForTrack(USER_ROLE.SUPER_ADMIN, TOUR_TRACK_CORE);
    expect(coreSteps.length).toBeLessThanOrEqual(8);
    expect(coreSteps.every((step) => step.chapter === TOUR_TRACK_CORE)).toBe(true);
  });

  it('shares Help starter hrefs with the tour catalog', () => {
    expect(helpFabSource).toContain('getRoleStarterSteps');
    const starters = getRoleStarterSteps(USER_ROLE.SUPER_ADMIN);
    expect(starters.map((step) => step.href)).toEqual(
      expect.arrayContaining([
        '/dashboard',
        '/executive',
        '/settings?section=loan-rules',
        '/documentation',
      ]),
    );
  });

  it('asserts every tour and starter href exists in role nav or allowed extras', () => {
    const roles = [
      USER_ROLE.SUPER_ADMIN,
      USER_ROLE.COLLECTOR,
      USER_ROLE.REGISTRATION_OFFICER,
      USER_ROLE.APPROVER,
      USER_ROLE.AUDITOR,
    ] as const;

    for (const role of roles) {
      const navItems = getNavItemsForRole(role);
      for (const href of listTourHrefs(role)) {
        expect(
          isTourHrefAllowed(href, navItems),
          `${role} tour href not covered by nav/extras: ${href}`,
        ).toBe(true);
      }
    }
  });

  it('uses stable data-tour hooks in catalog selectors', () => {
    expect(tourCatalogSource).toContain('data-tour="quick-help"');
    expect(tourCatalogSource).toContain('data-tour="notifications-bell"');
    expect(tourCatalogSource).toContain('data-tour="records-search"');
    expect(tourCatalogSource).toContain('data-tour="loan-rules-section"');
    expect(tourCatalogSource).toContain('data-tour="schedule-changes-queue"');
  });
});
