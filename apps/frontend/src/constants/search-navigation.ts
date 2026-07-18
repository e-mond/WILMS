import { USER_ROLE, type UserRole } from '@/constants/roles';

export interface SearchNavigationDestination {
  href: string;
  label: string;
  description: string;
  keywords: string[];
  roles: UserRole[];
}

/** Human-readable navigation destinations for the command palette. */
export const SEARCH_NAVIGATION_DESTINATIONS: SearchNavigationDestination[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Executive portfolio overview and KPIs',
    keywords: ['home', 'overview', 'kpi', 'portfolio'],
    roles: [USER_ROLE.SUPER_ADMIN],
  },
  {
    href: '/ops',
    label: 'Operations',
    description: 'System health, workers, queues, and runtime status',
    keywords: ['ops', 'health', 'system', 'queue', 'workers', 'metrics', 'platform'],
    roles: [USER_ROLE.SUPER_ADMIN],
  },
  {
    href: '/borrowers',
    label: 'Borrowers',
    description: 'Borrower directory',
    keywords: ['people', 'members'],
    roles: [USER_ROLE.SUPER_ADMIN],
  },
  {
    href: '/loan-pools',
    label: 'Loan Pools',
    description: 'Pool capital and allocation',
    keywords: ['pool', 'capital'],
    roles: [USER_ROLE.SUPER_ADMIN],
  },
  {
    href: '/reports',
    label: 'Reports',
    description: 'Operational and financial reports',
    keywords: ['analytics', 'export'],
    roles: [USER_ROLE.SUPER_ADMIN, USER_ROLE.AUDITOR],
  },
  {
    href: '/settings',
    label: 'Settings',
    description: 'Users, roles, integrations, and system configuration',
    keywords: ['admin', 'users', 'roles', 'permissions'],
    roles: [
      USER_ROLE.SUPER_ADMIN,
      USER_ROLE.COLLECTOR,
      USER_ROLE.REGISTRATION_OFFICER,
      USER_ROLE.APPROVER,
      USER_ROLE.AUDITOR,
    ],
  },
  {
    href: '/collector/dashboard',
    label: 'Collector Dashboard',
    description: 'Field collections overview',
    keywords: ['home', 'collections'],
    roles: [USER_ROLE.COLLECTOR],
  },
  {
    href: '/officer/register',
    label: 'Register Borrower',
    description: 'Start a new borrower registration',
    keywords: ['intake', 'kyc'],
    roles: [USER_ROLE.REGISTRATION_OFFICER],
  },
  {
    href: '/approver/pending',
    label: 'Pending Queue',
    description: 'Applications awaiting review',
    keywords: ['approvals', 'queue'],
    roles: [USER_ROLE.APPROVER],
  },
];
