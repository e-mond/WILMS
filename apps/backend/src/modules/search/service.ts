import { USER_ROLE } from '@wilms/shared-rbac';
import { listBorrowers, listGroups } from '../../db/persistence.js';
import { isDatabaseEnabled } from '../../db/client.js';
import * as userRepo from '../../repositories/user.repository.js';

export interface GlobalSearchResult {
  id: string;
  entityType: string;
  label: string;
  subtitle?: string;
  status?: string;
  photoUrl?: string;
  href: string;
  actionLabel?: string;
}

const DEFAULT_LIMIT = 8;

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

function entitiesForRole(role: string): Set<string> {
  switch (role) {
    case USER_ROLE.COLLECTOR:
      return new Set(['BORROWER', 'GROUP', 'PAYMENT']);
    case USER_ROLE.REGISTRATION_OFFICER:
      return new Set(['REGISTRATION', 'BORROWER']);
    case USER_ROLE.APPROVER:
      return new Set(['APPLICATION', 'BORROWER']);
    case USER_ROLE.AUDITOR:
      return new Set(['BORROWER', 'GROUP', 'COLLECTOR', 'LOAN_POOL', 'RISK_FLAG', 'REPORT', 'AUDIT_LOG']);
    default:
      return new Set([
        'BORROWER',
        'GROUP',
        'COLLECTOR',
        'LOAN_POOL',
        'RISK_FLAG',
        'REPORT',
        'USER',
        'PAYMENT',
        'AUDIT_LOG',
      ]);
  }
}

export async function globalSearch(input: {
  query: string;
  role: string;
  limit?: number;
}): Promise<GlobalSearchResult[]> {
  const query = input.query.trim().toLowerCase();
  const limit = input.limit ?? DEFAULT_LIMIT;

  if (!query) {
    return [];
  }

  const allowed = entitiesForRole(input.role);
  const results: GlobalSearchResult[] = [];

  if (allowed.has('BORROWER') || allowed.has('REGISTRATION') || allowed.has('APPLICATION')) {
    const borrowers = await listBorrowers();
    for (const borrower of borrowers) {
      if (
        !matchesQuery(borrower.fullName, query) &&
        !matchesQuery(borrower.phone, query) &&
        !matchesQuery(borrower.idNumber, query) &&
        !matchesQuery(borrower.groupName, query)
      ) {
        continue;
      }

      const entityType =
        input.role === USER_ROLE.APPROVER
          ? 'APPLICATION'
          : input.role === USER_ROLE.REGISTRATION_OFFICER
            ? 'REGISTRATION'
            : 'BORROWER';

      results.push({
        id: borrower.id,
        entityType,
        label: borrower.fullName,
        subtitle: `${borrower.community} · ${borrower.phone}`,
        status: borrower.status,
        href:
          input.role === USER_ROLE.APPROVER
            ? `/approver/review/${borrower.id}`
            : `/borrowers/${borrower.id}`,
        actionLabel: input.role === USER_ROLE.APPROVER ? 'Review' : 'Open',
      });
    }
  }

  if (allowed.has('GROUP')) {
    const groups = await listGroups();
    for (const group of groups) {
      if (
        !matchesQuery(group.displayName, query) &&
        !matchesQuery(group.id, query) &&
        !matchesQuery(group.community, query)
      ) {
        continue;
      }

      results.push({
        id: group.id,
        entityType: 'GROUP',
        label: group.displayName,
        subtitle: `${group.systemId} · ${group.community}`,
        status: 'Active',
        href:
          input.role === USER_ROLE.COLLECTOR
            ? `/collector/groups/${group.id}/collection-sheet`
            : `/groups/${group.id}`,
        actionLabel: 'Open group',
      });
    }
  }

  if (allowed.has('COLLECTOR') && isDatabaseEnabled()) {
    const collectors = await userRepo.listCollectors();
    for (const { user } of collectors) {
      if (!matchesQuery(user.displayName, query) && !matchesQuery(user.zone ?? '', query)) {
        continue;
      }

      results.push({
        id: user.id,
        entityType: 'COLLECTOR',
        label: user.displayName,
        subtitle: user.zone ?? '—',
        status: 'Active',
        href: `/collectors/${user.id}`,
        actionLabel: 'View profile',
      });
    }
  }

  if (allowed.has('USER') && isDatabaseEnabled()) {
    const users = await userRepo.listUsers();
    for (const user of users) {
      if (
        !matchesQuery(user.displayName, query) &&
        !matchesQuery(user.email, query) &&
        !matchesQuery(user.role, query)
      ) {
        continue;
      }

      results.push({
        id: user.id,
        entityType: 'USER',
        label: user.displayName,
        subtitle: `${user.role} · ${user.email}`,
        status: user.status,
        href: '/settings',
        actionLabel: 'Manage user',
      });
    }
  }

  return results.slice(0, limit);
}
