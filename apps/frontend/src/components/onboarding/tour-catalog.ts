import { USER_ROLE, type UserRole } from '@/constants/roles';
import {
  APPROVER_NAV,
  AUDITOR_NAV,
  COLLECTOR_NAV,
  REGISTRATION_OFFICER_NAV,
  SUPER_ADMIN_NAV,
  type ShellNavItem,
} from '@/constants/navigation';

export interface ProductTourStep {
  id: string;
  title: string;
  body: string;
  href?: string;
  targetSelector?: string;
  /** Chapter used for first-run core vs Help deep-dives and in-tour skip. */
  chapter: string;
  /**
   * On narrow viewports, open the mobile nav drawer before spotlighting.
   * Defaults to true when targetSelector includes data-tour-nav.
   */
  openMobileNav?: boolean;
}

export interface TourChapter {
  id: string;
  label: string;
  description: string;
}

export interface TourStarterLink {
  label: string;
  href: string;
}

export interface TourCompletionContent {
  nextAction: { label: string; href: string };
  checklist: [string, string, string];
}

/** First-run track id — short core loop. */
export const TOUR_TRACK_CORE = 'core';

/** Known integrated routes that may not appear in sidebar nav arrays. */
export const TOUR_EXTRA_ALLOWED_HREFS = [
  '/documentation',
  '/settings?section=loan-rules',
  '/settings?section=my-account',
] as const;

export const TOUR_CHAPTERS_BY_ROLE: Partial<Record<UserRole, TourChapter[]>> = {
  [USER_ROLE.SUPER_ADMIN]: [
    {
      id: TOUR_TRACK_CORE,
      label: 'Core loop',
      description: 'Operations Overview, Portfolio Health, applications, collections, and Loan rules.',
    },
    {
      id: 'people',
      label: 'People & records',
      description: 'Borrowers, loan file archive, collectors, and groups.',
    },
    {
      id: 'lending',
      label: 'Lending & money',
      description: 'Pools, disbursements, adjustments, and expenses.',
    },
    {
      id: 'platform',
      label: 'Platform & admin',
      description: 'Ops health, reports, communication, settings, and docs.',
    },
  ],
  [USER_ROLE.COLLECTOR]: [
    {
      id: TOUR_TRACK_CORE,
      label: 'Field workflow',
      description: 'Dashboard, collections, fees, reconciliation, and settings.',
    },
  ],
  [USER_ROLE.REGISTRATION_OFFICER]: [
    {
      id: TOUR_TRACK_CORE,
      label: 'Registration workflow',
      description: 'Register, track submissions, records, and account settings.',
    },
  ],
  [USER_ROLE.APPROVER]: [
    {
      id: TOUR_TRACK_CORE,
      label: 'Approval workflow',
      description: 'Queues, schedule changes, sync conflicts, records, and settings.',
    },
  ],
  [USER_ROLE.AUDITOR]: [
    {
      id: TOUR_TRACK_CORE,
      label: 'Audit workflow',
      description: 'Audit log, reports, records, and settings.',
    },
  ],
};

const SUPER_ADMIN_STEPS: ProductTourStep[] = [
  {
    id: 'intro',
    title: 'Quick Tour',
    body: 'This short core tour covers the Super Admin day-to-day loop. Deep-dives for people, lending, and platform pages are available anytime from Help.',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'dashboard',
    title: 'Operations Overview',
    body: 'Start on Operations Overview for work queues, portfolio strip, and the Loan rules shortcut.',
    href: '/dashboard',
    targetSelector: '[data-testid="operational-dashboard"], [data-tour-nav="/dashboard"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'executive',
    title: 'Portfolio Health',
    body: 'Open Executive for board-ready portfolio, PAR, cash, and forecast charts in the side panel.',
    href: '/executive',
    targetSelector: '[data-testid="executive-intelligence"], [data-tour-nav="/executive"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'applications',
    title: 'Applications',
    body: 'Review pending KYC applications from the Applications queue before borrowers can receive loans.',
    href: '/borrowers?status=PENDING',
    targetSelector:
      '[data-tour-nav="/borrowers?status=PENDING"], [data-testid="applications-queue-table"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'collections',
    title: 'Collections',
    body: 'Review daily collection performance, variance callouts, and the reconciliation queue.',
    href: '/reports/daily-collection',
    targetSelector:
      '[data-tour="collection-kpis"], [data-tour-nav="/reports/daily-collection"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'loan-rules',
    title: 'Loan rules',
    body: 'Configure lending rules under Settings → Loan Rules (also linked from the Operations Overview hero).',
    href: '/settings?section=loan-rules',
    targetSelector:
      '[data-tour="loan-rules-section"], [data-testid="settings-panel"], [data-tour-nav="/settings"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'help-tour',
    title: 'Help anytime',
    body: 'Restart the core tour or open deep-dive chapters from the Help button.',
    targetSelector: '[data-tour="quick-help"], [aria-label="Quick help"]',
    chapter: TOUR_TRACK_CORE,
    openMobileNav: false,
  },
  {
    id: 'borrowers',
    title: 'Borrowers',
    body: 'Browse the borrower directory, open profiles, and manage statuses across communities and groups.',
    href: '/borrowers',
    targetSelector: '[data-tour-nav="/borrowers"]',
    chapter: 'people',
  },
  {
    id: 'records',
    title: 'Borrower Records',
    body: 'Search the loan file archive by name, ID, phone, or guarantor. Recent searches are saved on this device.',
    href: '/records',
    targetSelector: '[data-tour="records-search"], [data-testid="records-search-panel"], [data-tour-nav="/records"]',
    chapter: 'people',
  },
  {
    id: 'collectors-groups',
    title: 'Collectors & Groups',
    body: 'Manage collector assignments and lending groups that organise borrowers in the field.',
    href: '/collectors',
    targetSelector: '[data-tour-nav="/collectors"]',
    chapter: 'people',
  },
  {
    id: 'loan-pools',
    title: 'Loan Pools',
    body: 'Monitor capital utilisation, disbursements, and repayment rates for each regional pool.',
    href: '/loan-pools',
    targetSelector: '[data-tour="loan-pool-kpis"], [data-tour-nav="/loan-pools"]',
    chapter: 'lending',
  },
  {
    id: 'loans',
    title: 'Disbursements',
    body: 'Create, approve, and disburse loans. Track lifecycle from draft through active repayment.',
    href: '/loans',
    targetSelector: '[data-tour-nav="/loans"]',
    chapter: 'lending',
  },
  {
    id: 'adjustments',
    title: 'Adjustments',
    body: 'Request write-offs and payment corrections. Select borrowers and loans by name — approved write-offs blacklist the borrower.',
    href: '/adjustments',
    targetSelector: '[data-tour-nav="/adjustments"]',
    chapter: 'lending',
  },
  {
    id: 'expenses',
    title: 'Expenses',
    body: 'Record and review field operating expenses. Expenses reduce operating cash, not loan principal.',
    href: '/expenses',
    targetSelector: '[data-tour-nav="/expenses"]',
    chapter: 'lending',
  },
  {
    id: 'risk',
    title: 'Risk & Flags',
    body: 'Monitor delinquency signals and flagged segments that need follow-up.',
    href: '/risk-flags',
    targetSelector: '[data-tour-nav="/risk-flags"]',
    chapter: 'platform',
  },
  {
    id: 'operations',
    title: 'Operations',
    body: 'Open the platform control centre for system health, workers, queues, and runtime status. This is separate from Operations Overview and Portfolio Health.',
    href: '/ops',
    targetSelector: '[data-tour="operations-dashboard"], [data-tour-nav="/ops"]',
    chapter: 'platform',
  },
  {
    id: 'reports',
    title: 'Reports',
    body: 'Open financial and operational reports. Export PDF, Excel, CSV, or Word from each report toolbar.',
    href: '/reports',
    targetSelector: '[data-tour-nav="/reports"]',
    chapter: 'platform',
  },
  {
    id: 'communication',
    title: 'Communication Center',
    body: 'Compose SMS, email, and in-app broadcasts for staff and programme audiences.',
    href: '/communication-center',
    targetSelector: '[data-testid="communication-center"], [data-tour-nav="/communication-center"]',
    chapter: 'platform',
  },
  {
    id: 'settings-account',
    title: 'Settings & account',
    body: 'Manage users, roles, holidays, automation, notifications, and your own account preferences.',
    href: '/settings?section=my-account',
    targetSelector: '[data-tour-nav="/settings"]',
    chapter: 'platform',
  },
  {
    id: 'documentation',
    title: 'Documentation Centre',
    body: 'Browse the branded product, technical, and operations books from the Documentation Centre.',
    href: '/documentation',
    targetSelector: '[data-testid="documentation-centre"], [data-tour="documentation-centre"]',
    chapter: 'platform',
  },
];

const COLLECTOR_STEPS: ProductTourStep[] = [
  {
    id: 'intro',
    title: 'Quick Tour',
    body: 'This tour covers your field dashboard, borrowers, fees, reconciliation, and device settings.',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'collector-dashboard',
    title: 'Field dashboard',
    body: "See today's collection progress, group cards, and jump into collection sheets.",
    href: '/collector/dashboard',
    targetSelector: '[data-testid="collector-field-dashboard"], [data-tour-nav="/collector/dashboard"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'collections',
    title: 'Borrowers',
    body: "Open assigned borrowers and record payments for today's groups.",
    href: '/collector/my-borrowers',
    targetSelector: '[data-tour-nav="/collector/my-borrowers"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'admin-fee',
    title: 'Collector fees',
    body: 'Track admin-fee collections required before loan disbursement.',
    href: '/collector/admin-fee',
    targetSelector: '[data-tour-nav="/collector/admin-fee"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'requests',
    title: 'Borrower requests',
    body: 'Review update requests submitted for borrowers on your book.',
    href: '/collector/borrower-updates',
    targetSelector: '[data-tour-nav="/collector/borrower-updates"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'expenses',
    title: 'Expenses',
    body: 'Record field expenses with receipts. Operating spend never changes loan principal.',
    href: '/collector/expenses',
    targetSelector: '[data-tour-nav="/collector/expenses"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'reconciliation',
    title: 'Reconcile',
    body: 'Submit daily cash reconciliation and flag variances when needed.',
    href: '/collector/reconciliation',
    targetSelector: '[data-tour-nav="/collector/reconciliation"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'holidays',
    title: 'Holidays',
    body: 'Request organisation holidays that shift repayment schedules after approval.',
    href: '/collector/holidays',
    targetSelector: '[data-tour-nav="/collector/holidays"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    body: 'Watch the bell icon for holiday approvals, sync alerts, and system events.',
    targetSelector: '[data-tour="notifications-bell"]',
    chapter: TOUR_TRACK_CORE,
    openMobileNav: false,
  },
  {
    id: 'offline',
    title: 'Offline queue',
    body: 'When offline, payments, expenses, and holiday requests are saved locally and synced when you reconnect.',
    href: '/collector/dashboard',
    targetSelector: '[data-tour-nav="/collector/dashboard"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'settings-account',
    title: 'Settings & account',
    body: 'Update your profile, enable App Lock (PIN/biometrics), and turn on push notifications.',
    href: '/collector/settings',
    targetSelector: '[data-tour-nav="/collector/settings"]',
    chapter: TOUR_TRACK_CORE,
  },
];

const OFFICER_STEPS: ProductTourStep[] = [
  {
    id: 'intro',
    title: 'Quick Tour',
    body: 'This tour covers registration, your submission queue, records search, and account settings.',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'register',
    title: 'Register borrower',
    body: 'Complete the guided wizard with photos, ID documents, guarantor details, and GPS verification.',
    href: '/officer/register',
    targetSelector: '[data-tour-nav="/officer/register"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'my-registrations',
    title: 'My registrations',
    body: 'Track drafts, submissions, and approval outcomes. Use Register borrower anytime from this page.',
    href: '/officer/my-registrations',
    targetSelector: '[data-testid="my-registrations-dashboard"], [data-tour-nav="/officer/my-registrations"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'requests',
    title: 'Borrower requests',
    body: 'Follow update requests that need registration officer attention.',
    href: '/officer/borrower-updates',
    targetSelector: '[data-tour-nav="/officer/borrower-updates"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'records',
    title: 'Borrower Records',
    body: 'Search borrower and guarantor files in the loan archive for verification.',
    href: '/officer/records',
    targetSelector: '[data-tour="records-search"], [data-tour-nav="/officer/records"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'offline',
    title: 'Offline readiness',
    body: 'Shell pages remain available offline. Watch the banner and sync when connectivity returns.',
    href: '/officer/register',
    targetSelector: '[data-tour-nav="/officer/register"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'settings-account',
    title: 'Settings & account',
    body: 'Protect this device with App Lock and update your profile under Settings.',
    href: '/officer/settings',
    targetSelector: '[data-tour="app-lock"], [data-tour-nav="/officer/settings"]',
    chapter: TOUR_TRACK_CORE,
  },
];

const APPROVER_STEPS: ProductTourStep[] = [
  {
    id: 'intro',
    title: 'Quick Tour',
    body: 'This tour covers your approval queues, schedule changes, records, and account settings.',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'pending-queue',
    title: 'Pending reviews',
    body: 'Inspect borrower profiles, documents, and guarantors — then approve or reject with a reason.',
    href: '/approver/pending',
    targetSelector: '[data-tour-nav="/approver/pending"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'reviewed',
    title: 'Reviewed',
    body: 'Look back at past approve/reject decisions when you need an audit trail of your work.',
    href: '/approver/reviewed',
    targetSelector: '[data-tour-nav="/approver/reviewed"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'holidays',
    title: 'Holiday requests',
    body: 'Review collector holiday requests with maker-checker. You cannot approve a request you created.',
    href: '/approver/holidays',
    targetSelector: '[data-tour-nav="/approver/holidays"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'schedule-changes',
    title: 'Payment day changes',
    body: 'Review requested payment-day schedule changes before they recalculate future weeks.',
    href: '/approver/schedule-changes',
    targetSelector:
      '[data-tour="schedule-changes-queue"], [data-tour-nav="/approver/schedule-changes"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'offline-sync',
    title: 'Offline sync conflicts',
    body: 'Approve or reject financial operations captured while collectors were offline.',
    href: '/approver/sync-conflicts',
    targetSelector: '[data-tour-nav="/approver/sync-conflicts"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'records',
    title: 'Borrower Records',
    body: 'Open the loan file archive when you need full KYC or repayment context during review.',
    href: '/approver/records',
    targetSelector: '[data-tour="records-search"], [data-tour-nav="/approver/records"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'settings-account',
    title: 'Settings & account',
    body: 'Protect approval sessions with App Lock and manage notification preferences.',
    href: '/approver/settings',
    targetSelector: '[data-tour="app-lock"], [data-tour-nav="/approver/settings"]',
    chapter: TOUR_TRACK_CORE,
  },
];

const AUDITOR_STEPS: ProductTourStep[] = [
  {
    id: 'intro',
    title: 'Quick Tour',
    body: 'This tour covers read-only compliance surfaces — audit log, reports, records, and account settings.',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'audit-logs',
    title: 'Audit log',
    body: 'Review immutable audit entries for sensitive platform actions.',
    href: '/auditor/audit-log',
    targetSelector: '[data-tour-nav="/auditor/audit-log"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'reports',
    title: 'Reports',
    body: 'Access read-only financial and operational reports and export for external reviews.',
    href: '/auditor/reports',
    targetSelector: '[data-tour-nav="/auditor/reports"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'records',
    title: 'Borrower Records',
    body: 'Search borrower and guarantor files when validating compliance samples.',
    href: '/auditor/records',
    targetSelector: '[data-tour="records-search"], [data-tour-nav="/auditor/records"]',
    chapter: TOUR_TRACK_CORE,
  },
  {
    id: 'settings-account',
    title: 'Settings & account',
    body: 'Adjust audit preferences and account security options under Settings.',
    href: '/auditor/settings',
    targetSelector: '[data-tour-nav="/auditor/settings"]',
    chapter: TOUR_TRACK_CORE,
  },
];

/** Full step inventory by role (all chapters). */
export const TOUR_STEPS_BY_ROLE: Partial<Record<UserRole, ProductTourStep[]>> = {
  [USER_ROLE.SUPER_ADMIN]: SUPER_ADMIN_STEPS,
  [USER_ROLE.COLLECTOR]: COLLECTOR_STEPS,
  [USER_ROLE.REGISTRATION_OFFICER]: OFFICER_STEPS,
  [USER_ROLE.APPROVER]: APPROVER_STEPS,
  [USER_ROLE.AUDITOR]: AUDITOR_STEPS,
};

export function getTourChapters(role: UserRole): TourChapter[] {
  return TOUR_CHAPTERS_BY_ROLE[role] ?? [];
}

export function getTourStepsForTrack(role: UserRole, trackId: string = TOUR_TRACK_CORE): ProductTourStep[] {
  const all = TOUR_STEPS_BY_ROLE[role] ?? [];
  const filtered = all.filter((step) => step.chapter === trackId);
  return filtered.length > 0 ? filtered : all.filter((step) => step.chapter === TOUR_TRACK_CORE);
}

export function getAllTourSteps(role: UserRole): ProductTourStep[] {
  return TOUR_STEPS_BY_ROLE[role] ?? [];
}

export function getRoleStarterSteps(role: string | undefined): TourStarterLink[] {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return [
        { label: 'Open Operations Overview', href: '/dashboard' },
        { label: 'Review Portfolio Health', href: '/executive' },
        { label: 'Configure Loan rules', href: '/settings?section=loan-rules' },
        { label: 'Browse Documentation Centre', href: '/documentation' },
      ];
    case USER_ROLE.COLLECTOR:
      return [
        { label: 'Open field dashboard', href: '/collector/dashboard' },
        { label: 'Record a collection', href: '/collector/my-borrowers' },
        { label: 'Submit reconciliation', href: '/collector/reconciliation' },
        { label: 'Review account settings', href: '/collector/settings' },
      ];
    case USER_ROLE.REGISTRATION_OFFICER:
      return [
        { label: 'Register a borrower', href: '/officer/register' },
        { label: 'Review my registrations', href: '/officer/my-registrations' },
        { label: 'Search borrower records', href: '/officer/records' },
        { label: 'Open settings', href: '/officer/settings' },
      ];
    case USER_ROLE.APPROVER:
      return [
        { label: 'Open pending queue', href: '/approver/pending' },
        { label: 'Review payment-day changes', href: '/approver/schedule-changes' },
        { label: 'Review offline sync', href: '/approver/sync-conflicts' },
        { label: 'Open settings', href: '/approver/settings' },
      ];
    case USER_ROLE.AUDITOR:
      return [
        { label: 'Open reports', href: '/auditor/reports' },
        { label: 'Open audit log', href: '/auditor/audit-log' },
        { label: 'Search borrower records', href: '/auditor/records' },
        { label: 'Open settings', href: '/auditor/settings' },
      ];
    default:
      return [{ label: 'Open settings', href: '/settings' }];
  }
}

export function getTourCompletion(role: UserRole): TourCompletionContent {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return {
        nextAction: { label: 'Open Operations Overview', href: '/dashboard' },
        checklist: [
          'Review Operations Overview queues and Loan rules',
          'Open Portfolio Health for board KPIs',
          'Invite a teammate under Settings → Users',
        ],
      };
    case USER_ROLE.COLLECTOR:
      return {
        nextAction: { label: 'Go to field dashboard', href: '/collector/dashboard' },
        checklist: [
          "Open today's groups from the field dashboard",
          'Record a borrower payment',
          'Submit daily cash reconciliation',
        ],
      };
    case USER_ROLE.REGISTRATION_OFFICER:
      return {
        nextAction: { label: 'Start a registration', href: '/officer/register' },
        checklist: [
          'Begin a new borrower registration',
          'Capture ID photos and GPS as prompted',
          'Track status under My registrations',
        ],
      };
    case USER_ROLE.APPROVER:
      return {
        nextAction: { label: 'Open pending reviews', href: '/approver/pending' },
        checklist: [
          'Open the pending approval queue',
          'Review documents and guarantors',
          'Approve or reject with a documented reason',
        ],
      };
    case USER_ROLE.AUDITOR:
      return {
        nextAction: { label: 'Open audit log', href: '/auditor/audit-log' },
        checklist: [
          'Review recent immutable audit entries',
          'Open read-only reports for compliance',
          'Search Borrower Records for sample files',
        ],
      };
    default:
      return {
        nextAction: { label: 'Continue', href: '/' },
        checklist: [
          'Explore your role home page',
          'Open Help anytime to replay this tour',
          'Update your profile under Settings',
        ],
      };
  }
}

export function shouldOpenMobileNavForStep(step: ProductTourStep): boolean {
  if (typeof step.openMobileNav === 'boolean') {
    return step.openMobileNav;
  }
  return Boolean(step.targetSelector?.includes('data-tour-nav'));
}

export function getNavItemsForRole(role: UserRole): ShellNavItem[] {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return SUPER_ADMIN_NAV;
    case USER_ROLE.COLLECTOR:
      return COLLECTOR_NAV;
    case USER_ROLE.REGISTRATION_OFFICER:
      return REGISTRATION_OFFICER_NAV;
    case USER_ROLE.APPROVER:
      return APPROVER_NAV;
    case USER_ROLE.AUDITOR:
      return AUDITOR_NAV;
    default:
      return [];
  }
}

export function isTourHrefAllowed(href: string, navItems: ShellNavItem[]): boolean {
  if ((TOUR_EXTRA_ALLOWED_HREFS as readonly string[]).includes(href)) {
    return true;
  }

  const navHrefs = navItems.map((item) => item.href);
  if (navHrefs.includes(href)) {
    return true;
  }

  const path = href.split('?')[0] ?? href;
  return navHrefs.some((navHref) => {
    const navPath = navHref.split('?')[0] ?? navHref;
    return navPath === path || navHref === href;
  });
}

/** All unique hrefs referenced by tour steps for a role (for CI assertions). */
export function listTourHrefs(role: UserRole): string[] {
  const hrefs = new Set<string>();
  for (const step of getAllTourSteps(role)) {
    if (step.href) {
      hrefs.add(step.href);
    }
  }
  for (const starter of getRoleStarterSteps(role)) {
    hrefs.add(starter.href);
  }
  return Array.from(hrefs).sort();
}

export type TourPageTipKey = 'records' | 'schedule-changes' | 'loan-rules';

export function getTourPageTip(key: TourPageTipKey): {
  title: string;
  body: string;
  trackId: string;
  roleHint?: UserRole;
} {
  switch (key) {
    case 'records':
      return {
        title: 'New here?',
        body: 'Search by name, phone, or ID. Restart the product tour from Help if you want a guided walkthrough of Records.',
        trackId: 'people',
      };
    case 'schedule-changes':
      return {
        title: 'Payment day queue tip',
        body: 'When this list is empty, there is nothing waiting. Open Help → guided tour to revisit how schedule changes fit the approval workflow.',
        trackId: TOUR_TRACK_CORE,
        roleHint: USER_ROLE.APPROVER,
      };
    case 'loan-rules':
      return {
        title: 'Loan rules tip',
        body: 'These caps drive new loan offers. Take the core Super Admin tour from Help to see where Loan rules sit in the daily loop.',
        trackId: TOUR_TRACK_CORE,
        roleHint: USER_ROLE.SUPER_ADMIN,
      };
  }
}
