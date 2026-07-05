import { BORROWER_STATUS } from '@/types/borrower';
import { formatBorrowerDisplayId } from '@wilms/shared-utils';
import { MOCK_GROUP_MEMBERS } from '@/mocks/group-members';
import { MOCK_GROUP_RISK_HISTORY } from '@/mocks/group-risk-history';
import { getCollectorsDemoDataset } from '@/services/mock/factories/collectors-demo.factory';
import { createSeededRng, pickFrom, randomInt } from '@/services/mock/factories/seeded-rng';
import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { resolveMockPhotoUrl } from '@/services/mock/photo-url.resolver';
import {
  getAddedMembers,
  getCollectorReassignment,
  getLeaderReplacement,
  getRemovedMemberIds,
} from '@/services/mock/group-membership.store';
import {
  GROUP_MEMBER_LOAN_STATUS,
  GROUP_MEMBER_ROLE,
  GROUP_RISK_LEVEL,
  type GroupMember,
  type GroupSourceRecord,
} from '@/types/group';
import {
  GROUP_STATUS,
  type GroupCollectorAssignment,
  type GroupCycleInfo,
  type GroupLeaderProfile,
  type GroupMemberDetail,
  type GroupStatus,
} from '@/types/group-detail';
import type { GroupRiskLevel } from '@/types/group';

const MEMBER_FIRST = [
  'Ama',
  'Adwoa',
  'Akua',
  'Abena',
  'Efua',
  'Grace',
  'Esi',
  'Yaw',
  'Kofi',
  'Akosua',
] as const;

const MEMBER_LAST = [
  'Mensah',
  'Owusu',
  'Boateng',
  'Asante',
  'Osei',
  'Ampofo',
  'Darko',
  'Serwaa',
  'Amponsah',
  'Nyarko',
] as const;

const SYNTHETIC_PROFILES = new Map<
  string,
  {
    fullName: string;
    phone: string;
    nationalId: string;
    address: string;
    gpsAddress: string;
    email?: string;
    groupId: string;
    groupName: string;
    community: string;
    registeredAt: string;
    status: (typeof BORROWER_STATUS)[keyof typeof BORROWER_STATUS];
  }
>();

function hashSeed(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function resolveGroupStatus(riskLevel: GroupRiskLevel): { status: GroupStatus; label: string } {
  switch (riskLevel) {
    case GROUP_RISK_LEVEL.SUSPENDED:
      return { status: GROUP_STATUS.SUSPENDED, label: 'Suspended' };
    case GROUP_RISK_LEVEL.FLAGGED:
      return { status: GROUP_STATUS.FLAGGED, label: 'Flagged' };
    case GROUP_RISK_LEVEL.AT_RISK:
      return { status: GROUP_STATUS.AT_RISK, label: 'At Risk' };
    default:
      return { status: GROUP_STATUS.ACTIVE, label: 'Active' };
  }
}

function buildCycleInfo(source: GroupSourceRecord): GroupCycleInfo {
  const formedYear = new Date(source.formedAt).getFullYear();
  const cycleNumber = Math.max(1, 2026 - formedYear + 3);

  return {
    label: `Cycle ${cycleNumber}`,
    number: cycleNumber,
    startedAt: `${2026}-01-01`,
  };
}

function buildCollectorAssignment(source: GroupSourceRecord): GroupCollectorAssignment {
  const collectors = getCollectorsDemoDataset().collectors;
  const reassignedId = getCollectorReassignment(source.id);
  const collector =
    (reassignedId ? collectors.find((entry) => entry.id === reassignedId) : undefined) ??
    collectors[hashSeed(source.id) % collectors.length] ??
    collectors[0]!;

  return {
    id: collector.id,
    fullName: collector.displayName,
    phone: '+23324' + String(1000000 + (hashSeed(collector.id) % 9000000)).slice(0, 7),
    email: `${collector.displayName.split(' ')[0]?.toLowerCase()}@wilms.demo`,
    zone: collector.zone,
    assignedGroupCount: collector.groupCount,
    collectionRatePercent: collector.collectionRatePercent,
    lastActiveAt: collector.lastActiveAt,
    photoUrl: collector.photoUrl ?? null,
  };
}

function loanStatusToBorrowerStatus(
  loanStatus: GroupMember['loanStatus'],
): (typeof BORROWER_STATUS)[keyof typeof BORROWER_STATUS] {
  if (loanStatus === GROUP_MEMBER_LOAN_STATUS.DEFAULTED) {
    return BORROWER_STATUS.DEFAULTED;
  }

  if (loanStatus === GROUP_MEMBER_LOAN_STATUS.ACTIVE) {
    return BORROWER_STATUS.APPROVED;
  }

  return BORROWER_STATUS.APPROVED;
}

function enrichMember(
  source: GroupSourceRecord,
  member: GroupMember,
  index: number,
): GroupMemberDetail {
  const registryEntry = getBorrowerRegistryEntry(member.borrowerId);

  if (registryEntry) {
    SYNTHETIC_PROFILES.set(member.borrowerId, {
      fullName: registryEntry.fullName,
      phone: registryEntry.phone,
      nationalId: registryEntry.idNumber,
      address: registryEntry.profile.houseAddress,
      gpsAddress: registryEntry.profile.gpsAddress,
      email: registryEntry.profile.email,
      groupId: source.id,
      groupName: source.name,
      community: registryEntry.community,
      registeredAt: registryEntry.registeredAt,
      status: registryEntry.status,
    });
  } else {
    const rng = createSeededRng(hashSeed(`${source.id}-${member.borrowerId}`));
    const phoneSuffix = String(1000000 + randomInt(rng, 0, 8999999)).padStart(7, '0');

    SYNTHETIC_PROFILES.set(member.borrowerId, {
      fullName: member.fullName,
      phone: `+23324${phoneSuffix}`,
      nationalId: `GHA-${String(randomInt(rng, 100000000, 999999999))}-0`,
      address: `${randomInt(rng, 1, 120)} ${pickFrom(rng, ['Market Road', 'Unity Street', 'Hope Avenue'])}`,
      gpsAddress: `GA-${randomInt(rng, 100, 999)}-${randomInt(rng, 1000, 9999)}`,
      email: `${member.fullName.split(' ')[0]?.toLowerCase()}@example.com`,
      groupId: source.id,
      groupName: source.name,
      community: source.community,
      registeredAt: source.formedAt,
      status: loanStatusToBorrowerStatus(member.loanStatus),
    });
  }

  const outstandingBase = Math.max(source.disbursedPesewas - source.collectedPesewas, 0);
  const outstandingPesewas =
    member.loanStatus === GROUP_MEMBER_LOAN_STATUS.NONE
      ? 0
      : member.loanStatus === GROUP_MEMBER_LOAN_STATUS.COMPLETED
        ? 0
        : Math.round(
            (outstandingBase / Math.max(source.activeMemberCount, 1)) *
              (member.loanStatus === GROUP_MEMBER_LOAN_STATUS.DEFAULTED ? 1.4 : 0.8),
          );

  return {
    ...member,
    displayId: registryEntry
      ? formatBorrowerDisplayId(
          {
            community: registryEntry.community,
            registeredAt: registryEntry.registeredAt,
          },
          index + 1,
        )
      : formatBorrowerDisplayId({
          community: source.community,
          registeredAt: source.formedAt,
          id: member.borrowerId,
        }),
    photoUrl: registryEntry
      ? resolveMockPhotoUrl({
          name: registryEntry.fullName,
          id: registryEntry.id,
          photoFileName: registryEntry.profile.photoFileName,
          photoUploadId: registryEntry.profile.photoUploadId,
        })
      : resolveMockPhotoUrl({ name: member.fullName, id: member.borrowerId }),
    phone: SYNTHETIC_PROFILES.get(member.borrowerId)?.phone ?? '+233240000000',
    borrowerStatus:
      SYNTHETIC_PROFILES.get(member.borrowerId)?.status ??
      loanStatusToBorrowerStatus(member.loanStatus),
    outstandingPesewas,
    lastPaymentDate:
      member.loanStatus === GROUP_MEMBER_LOAN_STATUS.ACTIVE
        ? new Date(Date.now() - randomInt(createSeededRng(index), 1, 14) * 86_400_000)
            .toISOString()
            .slice(0, 10)
        : member.loanStatus === GROUP_MEMBER_LOAN_STATUS.DEFAULTED
          ? null
          : '2026-05-20',
  };
}

function synthesizeMembers(source: GroupSourceRecord): GroupMember[] {
  const rng = createSeededRng(hashSeed(source.id));
  const members: GroupMember[] = [];
  const leaderName = source.leaderName;

  members.push({
    borrowerId: `${source.id}-leader`,
    fullName: leaderName,
    role: GROUP_MEMBER_ROLE.LEADER,
    loanStatus:
      source.collectionRatePercent >= 85
        ? GROUP_MEMBER_LOAN_STATUS.ACTIVE
        : GROUP_MEMBER_LOAN_STATUS.ACTIVE,
    paymentConsistencyPercent: Math.min(100, source.collectionRatePercent + 5),
  });

  while (members.length < source.memberCount) {
    const fullName = `${pickFrom(rng, MEMBER_FIRST)} ${pickFrom(rng, MEMBER_LAST)}`;

    if (members.some((member) => member.fullName === fullName)) {
      continue;
    }

    const loanRoll = randomInt(rng, 1, 100);
    const loanStatus =
      loanRoll > 92
        ? GROUP_MEMBER_LOAN_STATUS.DEFAULTED
        : loanRoll > 80
          ? GROUP_MEMBER_LOAN_STATUS.COMPLETED
          : loanRoll > 25
            ? GROUP_MEMBER_LOAN_STATUS.ACTIVE
            : GROUP_MEMBER_LOAN_STATUS.NONE;

    members.push({
      borrowerId: `${source.id}-m${members.length}`,
      fullName,
      role: GROUP_MEMBER_ROLE.MEMBER,
      loanStatus,
      paymentConsistencyPercent: randomInt(rng, 55, 100),
    });
  }

  return members;
}

export function resolveGroupMembers(source: GroupSourceRecord): GroupMemberDetail[] {
  const baseMembers = MOCK_GROUP_MEMBERS[source.id] ?? synthesizeMembers(source);
  const removedIds = getRemovedMemberIds(source.id);
  const filteredBase = baseMembers.filter((member) => !removedIds.has(member.borrowerId));
  const added = getAddedMembers(source.id);
  const combined = [...filteredBase, ...added];
  const leaderReplacementId = getLeaderReplacement(source.id);

  const normalizedMembers =
    leaderReplacementId === undefined
      ? combined
      : combined.map((member) => {
          if (member.borrowerId === leaderReplacementId) {
            return { ...member, role: GROUP_MEMBER_ROLE.LEADER };
          }

          if (member.role === GROUP_MEMBER_ROLE.LEADER) {
            return { ...member, role: GROUP_MEMBER_ROLE.MEMBER };
          }

          return member;
        });

  return normalizedMembers.map((member, index) => enrichMember(source, member, index));
}

export function resolveGroupRiskHistory(groupId: string) {
  return MOCK_GROUP_RISK_HISTORY[groupId] ?? [];
}

export function buildGroupLeaderProfile(
  source: GroupSourceRecord,
  members: GroupMemberDetail[],
): GroupLeaderProfile {
  const leader =
    members.find((member) => member.role === GROUP_MEMBER_ROLE.LEADER) ?? members[0]!;
  const profile = SYNTHETIC_PROFILES.get(leader?.borrowerId ?? '');

  return {
    borrowerId: leader?.borrowerId ?? `${source.id}-leader`,
    fullName: leader?.fullName ?? source.leaderName,
    phone: leader?.phone ?? '+233240000000',
    email: profile?.email,
    nationalId: profile?.nationalId ?? `GHA-${source.id.replace(/\D/g, '').slice(-9)}-0`,
    address: profile?.address ?? source.community,
    gpsAddress: profile?.gpsAddress ?? `GA-${hashSeed(source.id) % 900 + 100}-0000`,
    memberSince: source.formedAt,
    status: leader?.borrowerStatus ?? BORROWER_STATUS.APPROVED,
    photoUrl: leader?.photoUrl ?? null,
  };
}

export function getSyntheticBorrowerProfile(borrowerId: string) {
  return SYNTHETIC_PROFILES.get(borrowerId);
}

export function registerSyntheticBorrowerProfile(
  borrowerId: string,
  profile: NonNullable<ReturnType<typeof getSyntheticBorrowerProfile>>,
): void {
  SYNTHETIC_PROFILES.set(borrowerId, profile);
}

export function resolveGroupStatusMeta(riskLevel: GroupRiskLevel) {
  return resolveGroupStatus(riskLevel);
}

export function resolveGroupCollector(source: GroupSourceRecord) {
  return buildCollectorAssignment(source);
}

export function resolveGroupCycle(source: GroupSourceRecord) {
  return buildCycleInfo(source);
}

export function countActiveLoans(members: GroupMemberDetail[]): number {
  return members.filter((member) => member.loanStatus === GROUP_MEMBER_LOAN_STATUS.ACTIVE).length;
}

export function resetSyntheticBorrowerProfiles(): void {
  SYNTHETIC_PROFILES.clear();
}

export { resetGroupMembershipStore } from '@/services/mock/group-membership.store';
