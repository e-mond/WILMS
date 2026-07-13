import { BORROWER_STATUS } from '@/types/borrower';
import { REGISTRATION_WORKFLOW_STATUS_LABELS } from '@/constants/registration-workflow';
import { getGroupsDemoSources } from '@/services/mock/factories/groups-demo.factory';
import { MOCK_LOAN_POOLS } from '@/mocks/loan-pools';
import { MOCK_RISK_FLAGS } from '@/mocks/risk-flags';
import { MOCK_SETTINGS_USERS } from '@/mocks/settings-users';
import { USER_ROLE } from '@/constants/roles';
import type { ISearchService } from '@/types/services';
import type { GlobalSearchParams, GlobalSearchResult } from '@/types/search';
import { GLOBAL_SEARCH_ENTITY } from '@/types/search';
import { getBorrowerRegistryEntries } from '@/services/mock/borrower-registry.store';
import { getFinancialTransactions } from '@/services/mock/transaction-log.store';
import { simulateDelay } from '@/services/mock/delay';
import { buildCollectorSummaries } from '@/utils/collector-management-list';
import {
  getGlobalSearchEntitiesForRole,
  resolveBorrowerSearchHref,
} from '@/utils/global-search-scope';
import { resolveCollectorDisplayId, resolveGroupDisplayId, resolvePoolDisplayId } from '@/utils/entity-display-id';
import { resolveMockPhotoUrl } from '@/services/mock/photo-url.resolver';
import { resolveRegistrationWorkflowStatus } from '@/utils/registration-workflow.utils';
import reportServiceMock from '@/services/mock/reportService.mock';

const DEFAULT_LIMIT = 8;

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

function searchBorrowers(params: GlobalSearchParams): GlobalSearchResult[] {
  const query = params.query.trim().toLowerCase();

  if (!query) {
    return [];
  }

  return getBorrowerRegistryEntries()
    .filter((entry) => {
      if (params.role === USER_ROLE.APPROVER && entry.status !== BORROWER_STATUS.PENDING) {
        return false;
      }

      if (params.role === USER_ROLE.REGISTRATION_OFFICER) {
        return entry.registeredByOfficerId === 'user-officer';
      }

      return (
        matchesQuery(entry.fullName, query) ||
        matchesQuery(entry.phone, query) ||
        matchesQuery(entry.idNumber, query) ||
        matchesQuery(entry.groupName, query)
      );
    })
    .map((entry) => ({
      id: entry.id,
      entityType:
        params.role === USER_ROLE.APPROVER
          ? GLOBAL_SEARCH_ENTITY.APPLICATION
          : params.role === USER_ROLE.REGISTRATION_OFFICER
            ? GLOBAL_SEARCH_ENTITY.REGISTRATION
            : GLOBAL_SEARCH_ENTITY.BORROWER,
      label: entry.fullName,
      subtitle: `${entry.community} · ${entry.phone}`,
      status: REGISTRATION_WORKFLOW_STATUS_LABELS[
        resolveRegistrationWorkflowStatus(entry.status, entry.registeredAt)
      ],
      photoUrl: resolveMockPhotoUrl({
        name: entry.fullName,
        id: entry.id,
        photoFileName: entry.profile.photoFileName,
        photoUploadId: entry.profile.photoUploadId,
      }),
      href: resolveBorrowerSearchHref(params.role, entry.id),
      actionLabel: params.role === USER_ROLE.APPROVER ? 'Review' : 'Open',
    }));
}

function searchGroups(query: string, role: GlobalSearchParams['role']): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return getGroupsDemoSources()
    .filter(
      (group) =>
        matchesQuery(group.name, normalized) ||
        matchesQuery(group.id, normalized) ||
        matchesQuery(group.community, normalized),
    )
    .map((group) => ({
      id: group.id,
      entityType: GLOBAL_SEARCH_ENTITY.GROUP,
      label: group.name,
      subtitle: `${resolveGroupDisplayId(group)} · ${group.community}`,
      status: 'Active',
      href: role === USER_ROLE.COLLECTOR ? `/collector/groups/${group.id}/collection-sheet` : `/groups/${group.id}`,
      actionLabel: 'Open group',
    }));
}

function searchCollectors(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return buildCollectorSummaries(getFinancialTransactions())
    .filter(
      (collector) =>
        matchesQuery(collector.displayName, normalized) ||
        matchesQuery(collector.zone, normalized),
    )
    .map((collector) => ({
      id: collector.id,
      entityType: GLOBAL_SEARCH_ENTITY.COLLECTOR,
      label: collector.displayName,
      subtitle: `${resolveCollectorDisplayId(collector)} · ${collector.zone}`,
      status: 'Active',
      photoUrl: resolveMockPhotoUrl({ name: collector.displayName, id: collector.id }),
      href: `/collectors/${collector.id}`,
      actionLabel: 'View profile',
    }));
}

function searchLoanPools(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return MOCK_LOAN_POOLS.filter(
    (pool) =>
      matchesQuery(pool.name, normalized) ||
      matchesQuery(pool.id, normalized) ||
      matchesQuery(pool.region, normalized),
  ).map((pool) => ({
    id: pool.id,
    entityType: GLOBAL_SEARCH_ENTITY.LOAN_POOL,
    label: pool.name,
    subtitle: `${resolvePoolDisplayId(pool)} · ${pool.region}`,
    status: pool.status,
    href: '/loan-pools',
    actionLabel: 'Open pools',
  }));
}

function searchRiskFlags(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return MOCK_RISK_FLAGS.filter(
    (flag) =>
      matchesQuery(flag.entityName, normalized) ||
      matchesQuery(flag.id, normalized) ||
      matchesQuery(flag.community, normalized),
  ).map((flag) => ({
    id: flag.id,
    entityType: GLOBAL_SEARCH_ENTITY.RISK_FLAG,
    label: flag.entityName,
    subtitle: `${flag.id} · ${flag.community}`,
    status: flag.status,
    href: '/risk-flags',
    actionLabel: 'Review flag',
  }));
}

async function searchReports(query: string): Promise<GlobalSearchResult[]> {
  const normalized = query.trim().toLowerCase();
  const reports = await reportServiceMock.listAvailableReports();

  return reports
    .filter(
      (report) =>
        matchesQuery(report.title, normalized) || matchesQuery(report.description, normalized),
    )
    .map((report) => ({
      id: report.id,
      entityType: GLOBAL_SEARCH_ENTITY.REPORT,
      label: report.title,
      subtitle: report.description,
      status: report.category,
      href: report.route,
      actionLabel: 'Open report',
    }));
}

function searchUsers(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();

  return MOCK_SETTINGS_USERS.filter(
    (user) =>
      matchesQuery(user.displayName, normalized) ||
      matchesQuery(user.email, normalized) ||
      matchesQuery(user.roleLabel, normalized),
  ).map((user) => ({
    id: user.id,
    entityType: GLOBAL_SEARCH_ENTITY.USER,
    label: user.displayName,
    subtitle: `${user.roleLabel} · ${user.email}`,
    status: user.status,
    photoUrl: resolveMockPhotoUrl({ name: user.displayName, id: user.id }),
    href: '/settings',
    actionLabel: 'Manage user',
  }));
}

function searchPayments(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();

  return getBorrowerRegistryEntries()
    .filter((entry) => matchesQuery(entry.fullName, normalized) || matchesQuery(entry.phone, normalized))
    .slice(0, 5)
    .map((entry) => ({
      id: entry.id,
      entityType: GLOBAL_SEARCH_ENTITY.PAYMENT,
      label: entry.fullName,
      subtitle: `Payment record · ${entry.phone}`,
      status: 'Due today',
      photoUrl: resolveMockPhotoUrl({
        name: entry.fullName,
        id: entry.id,
        photoFileName: entry.profile.photoFileName,
        photoUploadId: entry.profile.photoUploadId,
      }),
      href: `/collector/payment/${entry.id}`,
      actionLabel: 'Record payment',
    }));
}

function searchAuditLogs(query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();
  const entries = [
    { id: 'audit-1', label: 'Borrower approved — Akosua Mensah', actor: 'Approver', route: '/auditor/audit-log' },
    { id: 'audit-2', label: 'Collector reassigned — Group G-014', actor: 'Super Admin', route: '/auditor/audit-log' },
    { id: 'audit-3', label: 'Daily collection report generated', actor: 'System', route: '/auditor/reports' },
  ];

  return entries
    .filter((entry) => matchesQuery(entry.label, normalized) || matchesQuery(entry.actor, normalized))
    .map((entry) => ({
      id: entry.id,
      entityType: GLOBAL_SEARCH_ENTITY.AUDIT_LOG,
      label: entry.label,
      subtitle: entry.actor,
      status: 'Logged',
      href: entry.route,
      actionLabel: 'View log',
    }));
}

const searchServiceMock: ISearchService = {
  async globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResult[]> {
    await simulateDelay();

    const query = params.query.trim().toLowerCase();
    const limit = params.limit ?? DEFAULT_LIMIT;

    if (!query) {
      return [];
    }

    const allowedEntities = getGlobalSearchEntitiesForRole(params.role);
    const results: GlobalSearchResult[] = [];

    if (
      allowedEntities.includes(GLOBAL_SEARCH_ENTITY.BORROWER) ||
      allowedEntities.includes(GLOBAL_SEARCH_ENTITY.REGISTRATION) ||
      allowedEntities.includes(GLOBAL_SEARCH_ENTITY.APPLICATION)
    ) {
      results.push(...searchBorrowers(params));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.GROUP)) {
      results.push(...searchGroups(query, params.role));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.COLLECTOR)) {
      results.push(...searchCollectors(query));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.LOAN_POOL)) {
      results.push(...searchLoanPools(query));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.RISK_FLAG)) {
      results.push(...searchRiskFlags(query));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.REPORT)) {
      results.push(...(await searchReports(query)));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.USER)) {
      results.push(...searchUsers(query));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.PAYMENT)) {
      results.push(...searchPayments(query));
    }

    if (allowedEntities.includes(GLOBAL_SEARCH_ENTITY.AUDIT_LOG)) {
      results.push(...searchAuditLogs(query));
    }

    return results.slice(0, limit);
  },
};

export default searchServiceMock;
