import type { UserRole } from '@/constants/roles';

export const GLOBAL_SEARCH_ENTITY = {
  BORROWER: 'BORROWER',
  GROUP: 'GROUP',
  COLLECTOR: 'COLLECTOR',
  LOAN_POOL: 'LOAN_POOL',
  LOAN: 'LOAN',
  REPORT: 'REPORT',
  USER: 'USER',
  REGISTRATION: 'REGISTRATION',
  PAYMENT: 'PAYMENT',
  APPLICATION: 'APPLICATION',
  AUDIT_LOG: 'AUDIT_LOG',
  RISK_FLAG: 'RISK_FLAG',
} as const;

export type GlobalSearchEntityType =
  (typeof GLOBAL_SEARCH_ENTITY)[keyof typeof GLOBAL_SEARCH_ENTITY];

export interface GlobalSearchResult {
  id: string;
  entityType: GlobalSearchEntityType;
  label: string;
  subtitle?: string;
  status?: string;
  photoUrl?: string;
  href: string;
  actionLabel?: string;
}

export interface GlobalSearchParams {
  query: string;
  role: UserRole;
  limit?: number;
}
