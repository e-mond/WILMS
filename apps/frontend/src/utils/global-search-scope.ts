import { USER_ROLE, type UserRole } from '@/constants/roles';
import { GLOBAL_SEARCH_ENTITY, type GlobalSearchEntityType } from '@/types/search';

const SUPER_ADMIN_ENTITIES: GlobalSearchEntityType[] = [
  GLOBAL_SEARCH_ENTITY.BORROWER,
  GLOBAL_SEARCH_ENTITY.GROUP,
  GLOBAL_SEARCH_ENTITY.COLLECTOR,
  GLOBAL_SEARCH_ENTITY.LOAN,
  GLOBAL_SEARCH_ENTITY.REPORT,
  GLOBAL_SEARCH_ENTITY.USER,
  GLOBAL_SEARCH_ENTITY.LOAN_POOL,
  GLOBAL_SEARCH_ENTITY.RISK_FLAG,
];

const APPROVER_ENTITIES: GlobalSearchEntityType[] = [
  GLOBAL_SEARCH_ENTITY.APPLICATION,
  GLOBAL_SEARCH_ENTITY.BORROWER,
  GLOBAL_SEARCH_ENTITY.GROUP,
];

const OFFICER_ENTITIES: GlobalSearchEntityType[] = [
  GLOBAL_SEARCH_ENTITY.REGISTRATION,
  GLOBAL_SEARCH_ENTITY.BORROWER,
];

const COLLECTOR_ENTITIES: GlobalSearchEntityType[] = [
  GLOBAL_SEARCH_ENTITY.GROUP,
  GLOBAL_SEARCH_ENTITY.BORROWER,
  GLOBAL_SEARCH_ENTITY.PAYMENT,
];

const AUDITOR_ENTITIES: GlobalSearchEntityType[] = [
  GLOBAL_SEARCH_ENTITY.REPORT,
  GLOBAL_SEARCH_ENTITY.AUDIT_LOG,
];

export function getGlobalSearchEntitiesForRole(role: UserRole): GlobalSearchEntityType[] {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return SUPER_ADMIN_ENTITIES;
    case USER_ROLE.APPROVER:
      return APPROVER_ENTITIES;
    case USER_ROLE.REGISTRATION_OFFICER:
      return OFFICER_ENTITIES;
    case USER_ROLE.COLLECTOR:
      return COLLECTOR_ENTITIES;
    case USER_ROLE.AUDITOR:
      return AUDITOR_ENTITIES;
    default:
      return [];
  }
}

export function resolveBorrowerSearchHref(role: UserRole, borrowerId: string): string {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return `/borrowers/${borrowerId}`;
    case USER_ROLE.APPROVER:
      return `/approver/pending/${borrowerId}`;
    case USER_ROLE.REGISTRATION_OFFICER:
      return `/borrowers/${borrowerId}`;
    case USER_ROLE.COLLECTOR:
      return `/collector/payment/${borrowerId}`;
    default:
      return '/';
  }
}

export function getGlobalSearchPlaceholder(role: UserRole): string {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return 'Search borrowers, collectors, groups, loans, reports, users...';
    case USER_ROLE.APPROVER:
      return 'Search applications, borrowers, groups...';
    case USER_ROLE.REGISTRATION_OFFICER:
      return 'Search registrations and borrowers you created...';
    case USER_ROLE.COLLECTOR:
      return 'Search assigned groups, borrowers, payments...';
    case USER_ROLE.AUDITOR:
      return 'Search reports and audit logs...';
    default:
      return 'Search WILMS...';
  }
}
