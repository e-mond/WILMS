import type { SettingsUserRecord } from '@/types/settings';
import type { SettingsUserProfile } from '@/types/user-management';
import { USER_ROLE } from '@/constants/roles';
import { getRolePermissionIds, USER_ROLE_TO_RBAC_ROLE_ID } from '@/lib/rbac/permission-matrix';
import { buildCollectionMetrics } from '@/services/mock/collection-metrics.builder';
import { COLLECTION_PERIOD } from '@/types/collection-metrics';
import { getCollectorsDemoDataset } from '@/services/mock/factories/collectors-demo.factory';
import { getAuditEntries } from '@/services/mock/audit-log.store';

export function buildUserProfileFromRecord(user: SettingsUserRecord): SettingsUserProfile {
  const collectors = getCollectorsDemoDataset().collectors;
  const collectorMatch = collectors.find((collector) => collector.id === user.id);
  const dailyMetrics = buildCollectionMetrics({
    period: COLLECTION_PERIOD.DAILY,
    referenceDate: '2026-06-09T12:00:00.000Z',
  }).organisationTotal;
  const weeklyMetrics = buildCollectionMetrics({
    period: COLLECTION_PERIOD.WEEKLY,
    referenceDate: '2026-06-09T12:00:00.000Z',
  }).organisationTotal;
  const monthlyMetrics = buildCollectionMetrics({
    period: COLLECTION_PERIOD.MONTHLY,
    referenceDate: '2026-06-09T12:00:00.000Z',
  }).organisationTotal;

  const auditEntries = getAuditEntries()
    .filter((entry) => entry.actorId === user.id)
    .slice(0, 5);

  const roleId = USER_ROLE_TO_RBAC_ROLE_ID[user.role as keyof typeof USER_ROLE_TO_RBAC_ROLE_ID];
  const assignedPermissionIds = roleId ? getRolePermissionIds(roleId) : [];
  const delegatedPermissionIds =
    user.role === USER_ROLE.COLLECTOR
      ? ['registration.create', 'approval.review']
      : user.role === USER_ROLE.APPROVER
        ? ['collection.record']
        : [];

  const profile: SettingsUserProfile = {
    id: user.id,
    displayName: user.displayName,
    staffId: user.id.toUpperCase().replace('USER-', 'STF-'),
    role: user.role,
    roleLabel: user.roleLabel,
    status: user.status,
    phone: '+233 24 000 0000',
    email: user.email,
    branch: collectorMatch?.zone ?? 'Head Office',
    region: collectorMatch?.zone ?? 'Greater Accra',
    zone: collectorMatch?.zone ?? 'Central',
    profileImageUrl: user.photoUrl ?? undefined,
    assignedGroups: collectorMatch ? [`GRP-${collectorMatch.id.slice(-4)}`] : ['GRP-0041'],
    assignedBorrowers: collectorMatch?.borrowerCount ?? 42,
    assignedPermissionIds,
    delegatedPermissionIds,
    lastLoginAt: user.lastLoginLabel,
    activityHistory: [
      {
        id: `${user.id}-activity-1`,
        title: 'Reviewed daily collection report',
        occurredAt: '2026-06-09T08:30:00.000Z',
      },
      {
        id: `${user.id}-activity-2`,
        title: 'Updated borrower profile',
        occurredAt: '2026-06-08T15:10:00.000Z',
      },
    ],
    loginHistory: [
      {
        id: `${user.id}-login-1`,
        occurredAt: '2026-06-09T09:41:00.000Z',
        deviceLabel: 'Chrome · Windows',
        locationLabel: 'Accra, GH',
      },
      {
        id: `${user.id}-login-2`,
        occurredAt: '2026-06-08T08:12:00.000Z',
        deviceLabel: 'Safari · iPhone',
        locationLabel: 'Accra, GH',
      },
    ],
    deviceHistory: [
      {
        id: `${user.id}-device-1`,
        deviceLabel: 'Chrome · Windows 11',
        lastSeenAt: '2026-06-09T09:41:00.000Z',
        platform: 'Desktop',
      },
      {
        id: `${user.id}-device-2`,
        deviceLabel: 'Safari · iPhone 15',
        lastSeenAt: '2026-06-08T08:12:00.000Z',
        platform: 'Mobile',
      },
    ],
    auditHistory: auditEntries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      targetLabel: entry.targetEntityId,
      occurredAt: entry.createdAt,
    })),
    performanceMetrics: {
      collectionRatePercent: collectorMatch?.collectionRatePercent ?? dailyMetrics.collectionRatePercent,
      dailyCollectedPesewas: collectorMatch?.collectedPesewas ?? dailyMetrics.collectedPesewas,
      weeklyCollectedPesewas: collectorMatch?.collectedPesewas ?? weeklyMetrics.collectedPesewas,
      monthlyCollectedPesewas: monthlyMetrics.collectedPesewas,
      borrowersManaged: collectorMatch?.borrowerCount ?? 42,
      expenseTotalPesewas: user.role === USER_ROLE.COLLECTOR ? 125000 : undefined,
    },
  };

  if (user.role === USER_ROLE.APPROVER) {
    profile.approvalMetrics = {
      approvalsCount: 128,
      rejectionsCount: 14,
      pendingQueueCount: 6,
    };
  }

  if (user.role === USER_ROLE.REGISTRATION_OFFICER) {
    profile.registrationMetrics = {
      registrationsCompleted: 86,
      pendingRegistrations: 4,
    };
  }

  return profile;
}
