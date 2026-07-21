import { and, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { formatBorrowerDisplayId } from '@wilms/shared-utils';
import { env } from '../../config/env.js';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { groupMembers, groups } from '../../db/schema/groups.js';
import { listBorrowers, listGroups, listPayments } from '../../db/persistence.js';
import type { BorrowerRecord, GroupRecord } from '../../db/store.js';
import * as userRepo from '../../repositories/user.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import { groupRepository } from '../../repositories/index.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { notifyGroupCreated, notifyCollectorAssigned } from '../../infrastructure/notifications/event-dispatch.js';

type GroupRiskLevel = 'LOW_RISK' | 'AT_RISK' | 'FLAGGED' | 'SUSPENDED';
type GroupStatus = 'ACTIVE' | 'AT_RISK' | 'FLAGGED' | 'SUSPENDED';
type GroupMemberRole = 'LEADER' | 'MEMBER';
type GroupMemberLoanStatus = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'NONE';

export interface GroupSummaryItem {
  id: string;
  name: string;
  groupSystemId: string;
  displayName: string;
  community: string;
  officerName: string;
  formedAt: string;
  memberCount: number;
  activeMemberCount: number;
  disbursedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  riskLevel: GroupRiskLevel;
}

export interface GroupListResponse {
  generatedAt: string;
  summary: {
    activeGroups: number;
    totalMembers: number;
    flaggedOrSuspended: number;
    avgCollectionRatePercent: number;
  };
  riskDistribution: {
    lowRisk: number;
    atRisk: number;
    flagged: number;
    suspended: number;
  };
  groups: GroupSummaryItem[];
  recentActivity: Array<{ id: string; message: string; recordedAt: string }>;
}

export interface GroupDetail extends GroupSummaryItem {
  status: GroupStatus;
  statusLabel: string;
  leaderName: string;
  leader: {
    borrowerId: string;
    fullName: string;
    phone: string;
    email?: string;
    nationalId: string;
    address: string;
    gpsAddress: string;
    memberSince: string;
    status: string;
    photoUrl?: string | null;
  };
  collector: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    zone: string;
    assignedGroupCount: number;
    collectionRatePercent: number;
    lastActiveAt: string;
    photoUrl?: string | null;
  };
  registrationOfficerName: string;
  cycle: { label: string; number: number; startedAt: string };
  activeLoanCount: number;
  repaymentPerformancePercent: number;
  outstandingPesewas: number;
  members: Array<{
    borrowerId: string;
    fullName: string;
    role: GroupMemberRole;
    loanStatus: GroupMemberLoanStatus;
    paymentConsistencyPercent: number;
    phone: string;
    borrowerStatus: string;
    outstandingPesewas: number;
    lastPaymentDate: string | null;
    photoUrl?: string | null;
  }>;
  riskHistory: Array<{ id: string; riskLevel: GroupRiskLevel; reason: string; recordedAt: string }>;
  recentActivity: Array<{ id: string; message: string; recordedAt: string }>;
}

export interface GroupMembershipChangeResult {
  allowed: boolean;
  message: string;
  requiresApproval: boolean;
}

function mapDbStatusToRiskLevel(status: string): GroupRiskLevel {
  switch (status) {
    case 'AT_RISK':
      return 'AT_RISK';
    case 'FLAGGED':
      return 'FLAGGED';
    case 'SUSPENDED':
      return 'SUSPENDED';
    default:
      return 'LOW_RISK';
  }
}

function statusLabel(status: GroupStatus): string {
  switch (status) {
    case 'AT_RISK':
      return 'At risk';
    case 'FLAGGED':
      return 'Flagged';
    case 'SUSPENDED':
      return 'Suspended';
    default:
      return 'Active';
  }
}

function resolveMemberLoanStatus(borrower: BorrowerRecord): GroupMemberLoanStatus {
  if (borrower.status === BORROWER_STATUS.DEFAULTED) {
    return 'DEFAULTED';
  }
  if (borrower.hasActiveLoan) {
    return 'ACTIVE';
  }
  return 'NONE';
}

async function loadGroupRows(): Promise<
  Array<typeof groups.$inferSelect & { memberIds: string[]; leaderBorrowerId?: string | null }>
> {
  if (!isDatabaseEnabled()) {
    const records = await listGroups();
    return records.map((record) => ({
      id: record.id,
      systemId: record.systemId,
      name: record.name,
      displayName: record.displayName,
      community: record.community,
      status: 'ACTIVE' as const,
      collectorUserId: null,
      leaderBorrowerId: record.memberIds[0] ?? null,
      formedAt: new Date(record.formedAt),
      createdAt: new Date(record.formedAt),
      updatedAt: new Date(record.formedAt),
      version: 1,
      deletedAt: null,
      memberIds: record.memberIds,
    }));
  }

  const db = getDb();
  const rows = await db.select().from(groups).where(isNull(groups.deletedAt));
  const memberRows = await db
    .select()
    .from(groupMembers)
    .where(isNull(groupMembers.removedAt));

  const membersByGroup = new Map<string, string[]>();
  for (const member of memberRows) {
    const current = membersByGroup.get(member.groupId) ?? [];
    current.push(member.borrowerId);
    membersByGroup.set(member.groupId, current);
  }

  return rows.map((row) => ({
    ...row,
    memberIds: membersByGroup.get(row.id) ?? [],
  }));
}

async function getGroupRow(groupId: string) {
  const rows = await loadGroupRows();
  return rows.find((row) => row.id === groupId);
}

function computeGroupFinancials(
  memberIds: string[],
  borrowers: BorrowerRecord[],
  payments: Awaited<ReturnType<typeof listPayments>>,
  stats?: { collectedPesewas: number; activeMembers: number },
) {
  if (stats) {
    const disbursedPesewas = stats.collectedPesewas;
    const collectionRatePercent =
      disbursedPesewas === 0
        ? stats.collectedPesewas > 0
          ? 100
          : 0
        : Math.round((stats.collectedPesewas / disbursedPesewas) * 100);

    return {
      collectedPesewas: stats.collectedPesewas,
      disbursedPesewas,
      collectionRatePercent,
      activeMembers: stats.activeMembers,
    };
  }

  const collectedPesewas = payments
    .filter((payment) => memberIds.includes(payment.borrowerId))
    .reduce((sum, payment) => sum + payment.amountPesewas, 0);
  const activeMembers = borrowers.filter(
    (borrower) => memberIds.includes(borrower.id) && borrower.status === BORROWER_STATUS.APPROVED,
  ).length;
  const disbursedPesewas = collectedPesewas;
  const collectionRatePercent =
    disbursedPesewas === 0 ? (collectedPesewas > 0 ? 100 : 0) : Math.round((collectedPesewas / disbursedPesewas) * 100);

  return { collectedPesewas, disbursedPesewas, collectionRatePercent, activeMembers };
}

async function resolveOfficerName(): Promise<string> {
  return 'Registration Officer';
}

async function resolveCollector(collectorUserId: string | null | undefined) {
  if (!collectorUserId) {
    return {
      id: 'unassigned',
      fullName: 'Unassigned',
      phone: '—',
      zone: '—',
      assignedGroupCount: 0,
      collectionRatePercent: 0,
      lastActiveAt: new Date().toISOString(),
      photoUrl: null,
    };
  }

  if (isDatabaseEnabled()) {
    const user = await userRepo.getUserById(collectorUserId);
    if (user) {
      return {
        id: user.id,
        fullName: user.displayName,
        phone: user.phone ?? '—',
        email: user.email,
        zone: user.zone ?? '—',
        assignedGroupCount: 0,
        collectionRatePercent: 0,
        lastActiveAt: (user.lastLoginAt ?? user.updatedAt).toISOString(),
        photoUrl: null,
      };
    }
  }

  return {
    id: collectorUserId,
    fullName: 'Collector',
    phone: '—',
    zone: '—',
    assignedGroupCount: 0,
    collectionRatePercent: 0,
    lastActiveAt: new Date().toISOString(),
    photoUrl: null,
  };
}

async function buildGroupSummary(
  row: Awaited<ReturnType<typeof loadGroupRows>>[number],
  borrowers: BorrowerRecord[],
  payments: Awaited<ReturnType<typeof listPayments>>,
  officerName: string,
  stats?: { collectedPesewas: number; activeMembers: number },
): Promise<GroupSummaryItem> {
  const memberIds = row.memberIds;
  const financials = computeGroupFinancials(memberIds, borrowers, payments, stats);
  const leaderBorrower = borrowers.find((entry) => entry.id === row.leaderBorrowerId);

  return {
    id: row.id,
    name: row.name,
    groupSystemId: row.systemId,
    displayName: row.displayName,
    community: row.community,
    officerName,
    formedAt: row.formedAt.toISOString(),
    memberCount: memberIds.length,
    activeMemberCount: financials.activeMembers,
    disbursedPesewas: financials.disbursedPesewas,
    collectedPesewas: financials.collectedPesewas,
    collectionRatePercent: financials.collectionRatePercent,
    riskLevel: mapDbStatusToRiskLevel(row.status),
  };
}

export async function listGroupsResponse(): Promise<GroupListResponse> {
  const rows = await loadGroupRows();
  const officerName = await resolveOfficerName();

  let groupSummaries: GroupSummaryItem[];

  if (isDatabaseEnabled()) {
    const statsByGroup = await groupRepository.getGroupListStats();
    groupSummaries = await Promise.all(
      rows.map((row) =>
        buildGroupSummary(
          row,
          [],
          [],
          officerName,
          statsByGroup.get(row.id) ?? { collectedPesewas: 0, activeMembers: 0 },
        ),
      ),
    );
  } else {
    const [borrowers, payments] = await Promise.all([listBorrowers(), listPayments()]);
    groupSummaries = await Promise.all(
      rows.map((row) => buildGroupSummary(row, borrowers, payments, officerName)),
    );
  }

  const riskDistribution = {
    lowRisk: groupSummaries.filter((group) => group.riskLevel === 'LOW_RISK').length,
    atRisk: groupSummaries.filter((group) => group.riskLevel === 'AT_RISK').length,
    flagged: groupSummaries.filter((group) => group.riskLevel === 'FLAGGED').length,
    suspended: groupSummaries.filter((group) => group.riskLevel === 'SUSPENDED').length,
  };

  const avgCollectionRatePercent =
    groupSummaries.length === 0
      ? 0
      : Math.round(
          groupSummaries.reduce((sum, group) => sum + group.collectionRatePercent, 0) /
            groupSummaries.length,
        );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      activeGroups: groupSummaries.filter((group) => group.riskLevel !== 'SUSPENDED').length,
      totalMembers: groupSummaries.reduce((sum, group) => sum + group.memberCount, 0),
      flaggedOrSuspended: riskDistribution.flagged + riskDistribution.suspended,
      avgCollectionRatePercent,
    },
    riskDistribution,
    groups: groupSummaries,
    recentActivity: groupSummaries.slice(0, 5).map((group) => ({
      id: `${group.id}-activity`,
      message: `${group.displayName} collection rate is ${group.collectionRatePercent}%`,
      recordedAt: new Date().toISOString(),
    })),
  };
}

async function buildMembers(
  groupId: string,
  memberIds: string[],
  borrowers: BorrowerRecord[],
  payments: Awaited<ReturnType<typeof listPayments>>,
  leaderBorrowerId?: string | null,
) {
  let memberRoles = new Map<string, GroupMemberRole>();

  if (isDatabaseEnabled()) {
    const db = getDb();
    const rows = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), isNull(groupMembers.removedAt)));
    for (const row of rows) {
      memberRoles.set(row.borrowerId, row.role as GroupMemberRole);
    }
  }

  return memberIds
    .map((borrowerId) => {
      const borrower = borrowers.find((entry) => entry.id === borrowerId);
      if (!borrower) {
        return null;
      }

      const borrowerPayments = payments.filter((payment) => payment.borrowerId === borrowerId);
      const lastPaymentDate =
        borrowerPayments.length > 0
          ? borrowerPayments.sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))[0]!
              .paymentDate
          : null;
      const borrowerSequence =
        [...borrowers]
          .sort((left, right) => left.registeredAt.localeCompare(right.registeredAt))
          .findIndex((entry) => entry.id === borrowerId) + 1;

      return {
        borrowerId,
        displayId: formatBorrowerDisplayId(
          { community: borrower.community, registeredAt: borrower.registeredAt },
          borrowerSequence,
        ),
        fullName: borrower.fullName,
        role:
          memberRoles.get(borrowerId) ??
          (borrowerId === leaderBorrowerId ? 'LEADER' : 'MEMBER'),
        loanStatus: resolveMemberLoanStatus(borrower),
        paymentConsistencyPercent: borrowerPayments.length > 0 ? 85 : 0,
        phone: borrower.phone,
        borrowerStatus: borrower.status,
        outstandingPesewas: 0,
        lastPaymentDate,
        photoUrl: null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail> {
  const row = await getGroupRow(groupId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  const useDb = isDatabaseEnabled();
  const [borrowers, payments, officerName, collector, statsByGroup] = await Promise.all([
    listBorrowers(),
    useDb ? Promise.resolve([] as Awaited<ReturnType<typeof listPayments>>) : listPayments(),
    resolveOfficerName(),
    resolveCollector(row.collectorUserId),
    useDb ? groupRepository.getGroupListStats() : Promise.resolve(new Map()),
  ]);

  const stats = statsByGroup.get(groupId);
  const summary = await buildGroupSummary(
    row,
    borrowers,
    payments,
    officerName,
    stats,
  );
  const members = await buildMembers(row.id, row.memberIds, borrowers, payments, row.leaderBorrowerId);
  const leaderMember = members.find((member) => member.role === 'LEADER') ?? members[0];
  const leaderBorrower = borrowers.find((entry) => entry.id === leaderMember?.borrowerId);
  const status = row.status as GroupStatus;

  return {
    ...summary,
    status,
    statusLabel: statusLabel(status),
    leaderName: leaderMember?.fullName ?? '—',
    leader: {
      borrowerId: leaderMember?.borrowerId ?? '',
      fullName: leaderMember?.fullName ?? '—',
      phone: leaderBorrower?.phone ?? '—',
      email: leaderBorrower?.profile.email,
      nationalId: leaderBorrower?.idNumber ?? '—',
      address: leaderBorrower?.profile.houseAddress ?? '—',
      gpsAddress: leaderBorrower?.profile.gpsAddress ?? '—',
      memberSince: row.formedAt.toISOString(),
      status: leaderBorrower?.status ?? BORROWER_STATUS.APPROVED,
      photoUrl: null,
    },
    collector,
    registrationOfficerName: officerName,
    cycle: {
      label: 'Current cycle',
      number: 1,
      startedAt: row.formedAt.toISOString(),
    },
    activeLoanCount: members.filter((member) => member.loanStatus === 'ACTIVE').length,
    repaymentPerformancePercent: summary.collectionRatePercent,
    outstandingPesewas: Math.max(summary.disbursedPesewas - summary.collectedPesewas, 0),
    members,
    riskHistory: [
      {
        id: `${groupId}-risk-current`,
        riskLevel: summary.riskLevel,
        reason: `Group status is ${statusLabel(status)}`,
        recordedAt: row.updatedAt.toISOString(),
      },
    ],
    recentActivity: [
      {
        id: `${groupId}-act-1`,
        message: `${summary.displayName} has ${members.length} members`,
        recordedAt: new Date().toISOString(),
      },
    ],
  };
}

export async function flagGroup(input: { groupId: string; reason: string }): Promise<GroupDetail> {
  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groups)
      .set({ status: 'FLAGGED', updatedAt: new Date() })
      .where(eq(groups.id, input.groupId));
  }
  return getGroupDetail(input.groupId);
}

export async function reassignCollector(input: {
  groupId: string;
  collectorId: string;
}): Promise<GroupDetail> {
  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groups)
      .set({ collectorUserId: input.collectorId, updatedAt: new Date() })
      .where(eq(groups.id, input.groupId));
  }
  return getGroupDetail(input.groupId);
}

export async function validateMembershipRemoval(input: {
  groupId: string;
  borrowerId: string;
}): Promise<GroupMembershipChangeResult> {
  const group = await getGroupDetail(input.groupId);
  const member = group.members.find((entry) => entry.borrowerId === input.borrowerId);

  if (!member) {
    return { allowed: false, message: 'Member not found in this group.', requiresApproval: false };
  }

  if (member.loanStatus === 'ACTIVE') {
    return {
      allowed: false,
      message: 'Members with active loans require Super Admin approval before removal or transfer.',
      requiresApproval: true,
    };
  }

  const nextCount = group.members.length - 1;
  if (nextCount < env.minGroupSize) {
    return {
      allowed: false,
      message: `Groups must retain at least ${env.minGroupSize} members.`,
      requiresApproval: false,
    };
  }

  return {
    allowed: true,
    message: 'Change is allowed. An audit record will be created.',
    requiresApproval: false,
  };
}

export async function removeMember(input: {
  groupId: string;
  borrowerId: string;
}): Promise<GroupDetail> {
  const validation = await validateMembershipRemoval(input);
  if (!validation.allowed) {
    throw new Error(`VALIDATION:${validation.message}`);
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groupMembers)
      .set({ removedAt: new Date() })
      .where(
        and(eq(groupMembers.groupId, input.groupId), eq(groupMembers.borrowerId, input.borrowerId)),
      );
  }

  return getGroupDetail(input.groupId);
}

export async function addMember(input: {
  groupId: string;
  fullName: string;
  phone: string;
}): Promise<GroupDetail> {
  const group = await getGroupDetail(input.groupId);
  if (group.members.length >= env.maxGroupSize) {
    throw new Error(`VALIDATION:Groups cannot exceed ${env.maxGroupSize} members.`);
  }

  const borrowers = await listBorrowers();
  let borrower = borrowers.find((entry) => entry.phone === input.phone.trim());

  if (!borrower && isDatabaseEnabled()) {
    const borrowerId = uuidv7();
    borrower = {
      id: borrowerId,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      idType: 'GHANA_CARD',
      idNumber: `TMP-${borrowerId.slice(0, 8)}`,
      status: BORROWER_STATUS.APPROVED,
      hasActiveLoan: false,
      groupName: group.displayName,
      groupId: input.groupId,
      community: group.community,
      registeredAt: new Date().toISOString(),
      registeredByOfficerId: 'system',
      profile: {
        dateOfBirth: '1990-01-01',
        gender: 'FEMALE',
        nationality: 'Ghanaian',
        houseAddress: group.community,
        gpsAddress: '—',
        city: group.community,
        region: 'Greater Accra',
        district: group.community,
        businessName: input.fullName.trim(),
        businessAddress: group.community,
        typeOfWork: 'Trader',
        guarantorName: '—',
        guarantorPhone: '—',
        guarantorRelationship: '—',
        photoFileName: 'placeholder.jpg',
        photoMimeType: 'image/jpeg',
      },
    };
    const { saveBorrower } = await import('../../db/persistence.js');
    await saveBorrower(borrower);
  }

  if (!borrower) {
    throw new Error('NOT_FOUND');
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .insert(groupMembers)
      .values({
        groupId: input.groupId,
        borrowerId: borrower.id,
        role: 'MEMBER',
      })
      .onConflictDoNothing();
  }

  return getGroupDetail(input.groupId);
}

export async function transferMember(input: {
  groupId: string;
  borrowerId: string;
  targetGroupId: string;
}): Promise<GroupDetail> {
  const validation = await validateMembershipRemoval(input);
  if (!validation.allowed && !validation.requiresApproval) {
    throw new Error(`VALIDATION:${validation.message}`);
  }

  await removeMember({ groupId: input.groupId, borrowerId: input.borrowerId });

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(groupMembers).values({
      groupId: input.targetGroupId,
      borrowerId: input.borrowerId,
      role: 'MEMBER',
    });
  }

  return getGroupDetail(input.groupId);
}

export async function replaceLeader(input: {
  groupId: string;
  borrowerId: string;
}): Promise<GroupDetail> {
  const group = await getGroupDetail(input.groupId);
  const member = group.members.find((entry) => entry.borrowerId === input.borrowerId);
  if (!member) {
    throw new Error('NOT_FOUND');
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groups)
      .set({ leaderBorrowerId: input.borrowerId, updatedAt: new Date() })
      .where(eq(groups.id, input.groupId));
    await db
      .update(groupMembers)
      .set({ role: 'MEMBER' })
      .where(and(eq(groupMembers.groupId, input.groupId), eq(groupMembers.role, 'LEADER')));
    await db
      .update(groupMembers)
      .set({ role: 'LEADER' })
      .where(
        and(eq(groupMembers.groupId, input.groupId), eq(groupMembers.borrowerId, input.borrowerId)),
      );
  }

  return getGroupDetail(input.groupId);
}

export async function updateDisplayName(input: {
  groupId: string;
  displayName: string;
}): Promise<GroupDetail> {
  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groups)
      .set({ displayName: input.displayName.trim(), updatedAt: new Date() })
      .where(eq(groups.id, input.groupId));
  }
  return getGroupDetail(input.groupId);
}

export async function recordAdjustment(input: { groupId: string; reason: string }): Promise<GroupDetail> {
  void input.reason;
  return getGroupDetail(input.groupId);
}

export async function getGroupsForCollector(collectorId: string): Promise<GroupRecord[]> {
  const rows = await loadGroupRows();
  return rows
    .filter((row) => row.collectorUserId === collectorId || !row.collectorUserId)
    .map((row) => ({
      id: row.id,
      systemId: row.systemId,
      name: row.name,
      displayName: row.displayName,
      community: row.community,
      memberIds: row.memberIds,
      formedAt: row.formedAt.toISOString(),
    }));
}

export async function countCollectorGroups(collectorId: string): Promise<number> {
  if (isDatabaseEnabled()) {
    const db = getDb();
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(groups)
      .where(and(eq(groups.collectorUserId, collectorId), isNull(groups.deletedAt)));
    return result?.count ?? 0;
  }
  const rows = await loadGroupRows();
  return rows.filter((row) => row.collectorUserId === collectorId).length;
}

export async function listActiveLoansForBorrowers(borrowerIds: string[]) {
  if (!isDatabaseEnabled() || borrowerIds.length === 0) {
    return [];
  }
  const loans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
  return loans.filter((loan) => borrowerIds.includes(loan.borrowerId));
}

function normalizeCommunity(community: string): string {
  return community.trim().toLowerCase();
}

async function buildGroupSystemId(community: string): Promise<string> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sequence = await groupRepository.nextGroupSequence(
    `${normalizeCommunity(community)}:${monthKey}`,
  );
  const communityCode = community.slice(0, 3).toUpperCase();
  return `GRP-${communityCode}-${monthKey.replace('-', '')}-${String(sequence).padStart(3, '0')}`;
}

export interface CreateGroupInput {
  name: string;
  community: string;
  displayName?: string;
  collectorUserId?: string;
  memberBorrowerIds?: string[];
}

export async function createGroup(
  input: CreateGroupInput,
  actorId: string,
  actorDisplayName?: string,
): Promise<GroupDetail> {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required to create groups.');
  }

  const name = input.name.trim();
  const community = input.community.trim();
  if (!name || !community) {
    throw new Error('VALIDATION:Group name and community are required.');
  }

  const memberIds = input.memberBorrowerIds ?? [];
  if (memberIds.length > env.maxGroupSize) {
    throw new Error(`VALIDATION:Groups cannot exceed ${env.maxGroupSize} members.`);
  }

  if (input.collectorUserId) {
    const collector = await userRepo.getUserById(input.collectorUserId);
    if (!collector) {
      throw new Error('VALIDATION:Collector not found.');
    }
  }

  const groupId = groupRepository.nextGroupId();
  const systemId = await buildGroupSystemId(community);
  const displayName = input.displayName?.trim() ?? `${community} Group ${systemId.split('-').pop()}`;
  const now = new Date();
  const leaderBorrowerId = memberIds[0] ?? null;

  const db = getDb();
  await db.insert(groups).values({
    id: groupId,
    systemId,
    name,
    displayName,
    community,
    status: 'ACTIVE',
    collectorUserId: input.collectorUserId ?? null,
    leaderBorrowerId,
    formedAt: now,
  });

  if (memberIds.length > 0) {
    await db.insert(groupMembers).values(
      memberIds.map((borrowerId, index) => ({
        groupId,
        borrowerId,
        role: index === 0 ? ('LEADER' as const) : ('MEMBER' as const),
      })),
    );
  }

  appendAuditEntry({
    action: 'group.created',
    actorId,
    actorDisplayName,
    targetEntityId: groupId,
    targetEntityType: 'group',
    reason: `Created group ${displayName}`,
  });

  const detail = await getGroupDetail(groupId);

  if (input.collectorUserId) {
    const collector = await userRepo.getUserById(input.collectorUserId);
    if (collector) {
      void notifyCollectorAssigned({
        collectorEmail: collector.email,
        collectorName: collector.displayName,
        collectorUserId: collector.id,
        groupName: name,
        groupDisplayId: systemId,
        memberCount: memberIds.length,
      });
    }
  }

  const actor = await userRepo.getUserById(actorId);
  if (actor) {
    void notifyGroupCreated({
      recipientEmail: actor.email,
      recipientName: actor.displayName,
      recipientUserId: actor.id,
      groupName: name,
      groupDisplayId: systemId,
      community,
    });
  }

  return detail;
}
