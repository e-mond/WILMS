import {
  GROUPS_DEMO_SEED,
  GROUPS_REFERENCE_COUNT,
  GROUPS_REFERENCE_FEATURED_GROUP,
  GROUPS_REFERENCE_RISK_DISTRIBUTION,
  GROUPS_REFERENCE_SUMMARY,
} from '@/constants/groups-reference-scale';
import { createSeededRng, pickFrom, randomInt, type SeededRng } from '@/services/mock/factories/seeded-rng';
import {
  GROUP_RISK_LEVEL,
  type GroupActivity,
  type GroupListResponse,
  type GroupRiskLevel,
  type GroupSourceRecord,
  type GroupSummary,
} from '@/types/group';
import {
  getAutomatedGroupSources,
  updateAutomatedGroupDisplayName,
} from '@/services/mock/group-formation.store';
import { enrichGroupSummary } from '@/utils/group-profile';
import { buildGroupSystemId } from '@/utils/group-system-id';

const GROUP_NAME_PREFIXES = [
  'Adwoa',
  'Akosua',
  'Sunrise',
  'Hope',
  'Onyame',
  'Fiifi',
  'Nhyira',
  'Blessed',
  'Unity',
  'Grace',
  'Mercy',
  'Victory',
] as const;

const GROUP_NAME_SUFFIXES = [
  'Women',
  'Circle',
  'Group',
  'Sisters',
  'Collective',
  'Union',
  'Fellowship',
  'Mbrenhoma',
] as const;

const COMMUNITIES = [
  'Madina, Accra',
  'Tema Comm. 5',
  'Madina',
  'Osu',
  'Accra New Town',
  'Cape Coast',
  'Legon',
  'Kumasi',
  'Ashaiman',
  'Labadi',
] as const;

const OFFICERS = ['Abena Owusu', 'Yaw Darko', 'Esi Amponsah', 'Kofi Mensah'] as const;

/** Pre-tuned rates targeting 84.2% average across 148 groups. */
const REFERENCE_COLLECTION_RATES = [
  100, 98, 97, 96, 95, 94, 93, 92, 91, 90, 96, 97, 99, 100, 95, 94, 93, 92, 91, 90,
  89, 88, 87, 86, 85, 96, 97, 98, 99, 100, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86,
  85, 96, 97, 98, 99, 100, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 96, 97, 98,
  99, 100, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 96, 97, 98, 99, 100, 95, 94,
  93, 92, 91, 90, 89, 88, 87, 86, 85, 96, 97, 98, 99, 100, 95, 94, 93, 92, 91, 90,
  89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70,
  68, 66, 64, 62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30,
  88, 86, 84, 82, 80, 78, 76, 74,
] as const;

let cachedResponse: GroupListResponse | null = null;
let cachedSources: GroupSourceRecord[] | null = null;

function formatGroupId(index: number): string {
  return `GRP-${String(index + 1).padStart(4, '0')}`;
}

function buildRiskLevelSequence(): GroupRiskLevel[] {
  return [
    ...Array.from({ length: GROUPS_REFERENCE_RISK_DISTRIBUTION.lowRisk }, () =>
      GROUP_RISK_LEVEL.LOW_RISK,
    ),
    ...Array.from({ length: GROUPS_REFERENCE_RISK_DISTRIBUTION.atRisk }, () =>
      GROUP_RISK_LEVEL.AT_RISK,
    ),
    ...Array.from({ length: GROUPS_REFERENCE_RISK_DISTRIBUTION.flagged }, () =>
      GROUP_RISK_LEVEL.FLAGGED,
    ),
    ...Array.from({ length: GROUPS_REFERENCE_RISK_DISTRIBUTION.suspended }, () =>
      GROUP_RISK_LEVEL.SUSPENDED,
    ),
  ];
}

function shuffleRiskLevels(rng: SeededRng, levels: GroupRiskLevel[]): GroupRiskLevel[] {
  const copy = [...levels];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }

  return copy;
}

function rateForRiskLevel(riskLevel: GroupRiskLevel, fallbackRate: number): number {
  switch (riskLevel) {
    case GROUP_RISK_LEVEL.LOW_RISK:
      return Math.max(fallbackRate, 85);
    case GROUP_RISK_LEVEL.AT_RISK:
      return Math.min(Math.max(fallbackRate, 70), 84);
    case GROUP_RISK_LEVEL.FLAGGED:
      return Math.min(fallbackRate, 69);
    case GROUP_RISK_LEVEL.SUSPENDED:
      return Math.min(fallbackRate, 55);
    default:
      return fallbackRate;
  }
}

function buildMemberCounts(
  rng: SeededRng,
  count: number,
  targetTotal: number,
): Array<{ memberCount: number; activeMemberCount: number }> {
  const counts = Array.from({ length: count }, () => {
    const memberCount = randomInt(rng, 12, 20);
    const activeMemberCount = randomInt(rng, Math.max(8, memberCount - 4), memberCount);

    return { memberCount, activeMemberCount };
  });

  const currentTotal = counts.reduce((total, entry) => total + entry.memberCount, 0);
  const delta = targetTotal - currentTotal;
  counts[0]!.memberCount = Math.max(8, counts[0]!.memberCount + delta);
  counts[0]!.activeMemberCount = Math.min(
    counts[0]!.memberCount,
    Math.max(1, counts[0]!.activeMemberCount + Math.round(delta * 0.85)),
  );

  return counts;
}

function buildRecentActivity(): GroupActivity[] {
  const now = Date.now();

  return [
    {
      id: 'grp-act-1',
      message: 'GRP-0033 flagged for missed payments',
      recordedAt: new Date(now - 2 * 3_600_000).toISOString(),
    },
    {
      id: 'grp-act-2',
      message: 'GRP-0041 new member added',
      recordedAt: new Date(now - 4 * 3_600_000).toISOString(),
    },
    {
      id: 'grp-act-3',
      message: 'GRP-0029 completed Cycle 7',
      recordedAt: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: 'grp-act-4',
      message: 'GRP-0018 suspended due to 3 defaults',
      recordedAt: new Date(now - 2 * 86_400_000).toISOString(),
    },
  ];
}

function buildReferenceGroups(rng: SeededRng): {
  groups: GroupSummary[];
  sources: GroupSourceRecord[];
} {
  const riskLevels = shuffleRiskLevels(rng, buildRiskLevelSequence());
  const memberCounts = buildMemberCounts(
    rng,
    GROUPS_REFERENCE_COUNT,
    GROUPS_REFERENCE_SUMMARY.totalMembers,
  );

  const groups: GroupSummary[] = [];
  const sources: GroupSourceRecord[] = [];

  for (let index = 0; index < GROUPS_REFERENCE_COUNT; index += 1) {
    const isFeatured = index === 40;
    const riskLevel = isFeatured ? GROUP_RISK_LEVEL.AT_RISK : riskLevels[index]!;
    const fallbackRate = REFERENCE_COLLECTION_RATES[index % REFERENCE_COLLECTION_RATES.length]!;
    const collectionRatePercent = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.collectionRatePercent
      : rateForRiskLevel(riskLevel, fallbackRate);

    const memberCount = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.memberCount
      : memberCounts[index]!.memberCount;
    const activeMemberCount = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.activeMemberCount
      : memberCounts[index]!.activeMemberCount;

    const disbursedPesewas = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.disbursedPesewas
      : randomInt(rng, 1_800_000, 6_400_000);
    const collectedPesewas = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.collectedPesewas
      : Math.round((disbursedPesewas * collectionRatePercent) / 100);

    const name = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.name
      : `${pickFrom(rng, GROUP_NAME_PREFIXES)} ${pickFrom(rng, GROUP_NAME_SUFFIXES)}`;
    const id = isFeatured ? GROUPS_REFERENCE_FEATURED_GROUP.id : formatGroupId(index);
    const community = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.community
      : pickFrom(rng, COMMUNITIES);
    const officerName = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.officerName
      : pickFrom(rng, OFFICERS);
    const formedAt = isFeatured
      ? GROUPS_REFERENCE_FEATURED_GROUP.formedAt
      : `202${randomInt(rng, 0, 4)}-${String(randomInt(rng, 1, 12)).padStart(2, '0')}-01`;

    const source: GroupSourceRecord = {
      id,
      name,
      groupSystemId: buildGroupSystemId(community, new Date(formedAt), index + 1),
      displayName: name,
      community,
      officerName,
      leaderName: isFeatured
        ? GROUPS_REFERENCE_FEATURED_GROUP.leaderName
        : name.split(' ').slice(0, 2).join(' '),
      formedAt,
      memberCount,
      activeMemberCount,
      disbursedPesewas,
      collectedPesewas,
      collectionRatePercent,
      defaultedMemberCount:
        riskLevel === GROUP_RISK_LEVEL.FLAGGED || riskLevel === GROUP_RISK_LEVEL.SUSPENDED
          ? randomInt(rng, 1, 3)
          : undefined,
      isManuallySuspended: riskLevel === GROUP_RISK_LEVEL.SUSPENDED,
    };

    sources.push(source);
    groups.push(enrichGroupSummary(source));
  }

  groups.sort((left, right) => left.id.localeCompare(right.id));
  sources.sort((left, right) => left.id.localeCompare(right.id));

  const featuredIndex = groups.findIndex((group) => group.id === GROUPS_REFERENCE_FEATURED_GROUP.id);

  if (featuredIndex > 0) {
    const [featuredGroup] = groups.splice(featuredIndex, 1);
    const [featuredSource] = sources.splice(
      sources.findIndex((source) => source.id === GROUPS_REFERENCE_FEATURED_GROUP.id),
      1,
    );

    if (featuredGroup && featuredSource) {
      groups.unshift(featuredGroup);
      sources.unshift(featuredSource);
    }
  }

  return { groups, sources };
}

export function generateGroupsDemoDataset(seed = GROUPS_DEMO_SEED): GroupListResponse {
  const rng = createSeededRng(seed);
  const { groups, sources } = buildReferenceGroups(rng);

  cachedSources = sources;

  return {
    generatedAt: '2026-06-08T12:00:00.000Z',
    summary: { ...GROUPS_REFERENCE_SUMMARY },
    riskDistribution: { ...GROUPS_REFERENCE_RISK_DISTRIBUTION },
    groups,
    recentActivity: buildRecentActivity(),
  };
}

export function getGroupsDemoDataset(): GroupListResponse {
  if (!cachedResponse) {
    cachedResponse = generateGroupsDemoDataset();
  }

  const automatedSources = getAutomatedGroupSources();

  if (automatedSources.length === 0) {
    return cachedResponse;
  }

  const automatedGroups = automatedSources.map(enrichGroupSummary);

  return {
    ...cachedResponse,
    groups: [...automatedGroups, ...cachedResponse.groups],
  };
}

export function getGroupsDemoSources(): GroupSourceRecord[] {
  if (!cachedSources) {
    generateGroupsDemoDataset();
  }

  return cachedSources ?? [];
}

export function getGroupsDemoSourceById(id: string): GroupSourceRecord | undefined {
  const automated = getAutomatedGroupSources().find((source) => source.id === id);

  if (automated) {
    return automated;
  }

  return getGroupsDemoSources().find((source) => source.id === id);
}

function syncCachedResponseGroupName(groupId: string, displayName: string): void {
  if (!cachedResponse) {
    return;
  }

  cachedResponse = {
    ...cachedResponse,
    groups: cachedResponse.groups.map((group) =>
      group.id === groupId ? { ...group, name: displayName, displayName } : group,
    ),
  };
}

export function updateGroupSourceDisplayName(
  groupId: string,
  displayName: string,
): GroupSourceRecord | undefined {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return undefined;
  }

  if (cachedSources) {
    const index = cachedSources.findIndex((source) => source.id === groupId);

    if (index >= 0) {
      cachedSources[index] = {
        ...cachedSources[index]!,
        displayName: trimmed,
        name: trimmed,
      };
      syncCachedResponseGroupName(groupId, trimmed);
      return { ...cachedSources[index]! };
    }
  }

  return updateAutomatedGroupDisplayName(groupId, trimmed);
}

export function resetGroupsDemoDataset(): void {
  cachedResponse = null;
  cachedSources = null;
}

/** Test helper — verifies generated dataset matches reference targets. */
export function groupsDatasetMatchesReference(dataset: GroupListResponse): boolean {
  return (
    dataset.groups.length === GROUPS_REFERENCE_COUNT &&
    dataset.summary.activeGroups === GROUPS_REFERENCE_SUMMARY.activeGroups &&
    dataset.summary.totalMembers === GROUPS_REFERENCE_SUMMARY.totalMembers &&
    dataset.summary.flaggedOrSuspended === GROUPS_REFERENCE_SUMMARY.flaggedOrSuspended &&
    dataset.summary.avgCollectionRatePercent ===
      GROUPS_REFERENCE_SUMMARY.avgCollectionRatePercent &&
    dataset.riskDistribution.lowRisk === GROUPS_REFERENCE_RISK_DISTRIBUTION.lowRisk &&
    dataset.riskDistribution.atRisk === GROUPS_REFERENCE_RISK_DISTRIBUTION.atRisk &&
    dataset.riskDistribution.flagged === GROUPS_REFERENCE_RISK_DISTRIBUTION.flagged &&
    dataset.riskDistribution.suspended === GROUPS_REFERENCE_RISK_DISTRIBUTION.suspended
  );
}
