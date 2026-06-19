import {
  RISK_FLAGS_DEMO_SEED,
  RISK_FLAGS_REFERENCE_COUNT,
  RISK_FLAGS_REFERENCE_TYPE_COUNTS,
} from '@/constants/risk-flags-reference-scale';
import { MOCK_RISK_FLAGS } from '@/mocks/risk-flags';
import {
  FLAG_ENTITY_TYPE,
  FLAG_STATUS,
  FLAG_TYPE,
  type FlagStatus,
  type FlagType,
  type RiskFlagListResponse,
  type RiskFlagSummary,
} from '@/types/risk-flag';
import { createSeededRng, pickFrom, randomInt, type SeededRng } from '@/services/mock/factories/seeded-rng';
import { buildRiskFlagListResponse } from '@/utils/risk-flag-list';

const BORROWER_FIRST_NAMES = [
  'Kwame',
  'Ama',
  'Abena',
  'Kofi',
  'Efua',
  'Yaw',
  'Akosua',
  'Grace',
  'Adjoa',
  'Fiifi',
] as const;

const BORROWER_LAST_NAMES = [
  'Asante',
  'Mensah',
  'Osei',
  'Boateng',
  'Owusu',
  'Darko',
  'Ampofo',
  'Serwaa',
  'Duodu',
  'Kwarteng',
] as const;

const GROUP_NAMES = [
  'Sunrise Women',
  'Hope Circle',
  'Onyame Bekyere',
  'Adwoa Nhyira Group',
  'Unity Traders',
  'Grace Weavers',
] as const;

const COMMUNITIES = [
  'Madina',
  'Tema Comm. 5',
  'Osu',
  'Cape Coast',
  'Kaneshie',
  'Accra New Town',
  'Legon',
  'Ashaiman',
] as const;

const OFFICERS = ['Kofi Mensah', 'Abena Owusu', 'Esi Amponsah', 'Yaw Darko', 'Super Admin'] as const;

/** Pre-tuned open statuses for generated rows — yields ~47 open flags overall. */
const GENERATED_STATUSES: FlagStatus[] = [
  FLAG_STATUS.OPEN,
  FLAG_STATUS.OPEN,
  FLAG_STATUS.CRITICAL,
  FLAG_STATUS.UNDER_REVIEW,
  FLAG_STATUS.OPEN,
  FLAG_STATUS.RESOLVED,
];

let cachedResponse: RiskFlagListResponse | null = null;

function formatFlagId(sequence: number): string {
  return `FLG-${String(sequence).padStart(4, '0')}`;
}

function countFlagsByType(flags: RiskFlagSummary[]): Record<FlagType, number> {
  return Object.values(FLAG_TYPE).reduce(
    (counts, flagType) => {
      counts[flagType] = flags.filter((flag) => flag.flagType === flagType).length;
      return counts;
    },
    {} as Record<FlagType, number>,
  );
}

function generateEntity(
  rng: SeededRng,
  flagType: FlagType,
): Pick<RiskFlagSummary, 'entityId' | 'entityName' | 'entityType' | 'groupName'> {
  if (flagType === FLAG_TYPE.DEFAULT && rng() > 0.35) {
    const groupName = pickFrom(rng, GROUP_NAMES);
    return {
      entityId: `GRP-${String(randomInt(rng, 1, 40)).padStart(4, '0')}`,
      entityName: groupName,
      entityType: FLAG_ENTITY_TYPE.GROUP,
      groupName,
    };
  }

  if (flagType === FLAG_TYPE.DUPLICATE_ID && rng() > 0.5) {
    return {
      entityId: `APP-${String(randomInt(rng, 1, 99)).padStart(4, '0')}`,
      entityName: `${pickFrom(rng, BORROWER_FIRST_NAMES)} ${pickFrom(rng, BORROWER_LAST_NAMES)}`,
      entityType: FLAG_ENTITY_TYPE.APPLICATION,
    };
  }

  const displayName = `${pickFrom(rng, BORROWER_FIRST_NAMES)} ${pickFrom(rng, BORROWER_LAST_NAMES)}`;
  return {
    entityId: `BRW-${String(randomInt(rng, 100, 999)).padStart(5, '0')}`,
    entityName: displayName,
    entityType: FLAG_ENTITY_TYPE.BORROWER,
    groupName: pickFrom(rng, GROUP_NAMES),
  };
}

function generateFlag(
  rng: SeededRng,
  flagType: FlagType,
  sequence: number,
  status: FlagStatus,
): RiskFlagSummary {
  const entity = generateEntity(rng, flagType);
  const weeksOverdue =
    flagType === FLAG_TYPE.MISSED_PAYMENT || flagType === FLAG_TYPE.DEFAULT
      ? randomInt(rng, 1, 8)
      : flagType === FLAG_TYPE.BLACKLISTED
        ? randomInt(rng, 4, 12)
        : undefined;
  const arrearsPesewas =
    flagType === FLAG_TYPE.DUPLICATE_ID || flagType === FLAG_TYPE.FRAUD_SUSPICION
      ? randomInt(rng, 0, 1) * randomInt(rng, 50_000, 500_000)
      : randomInt(rng, 8_000, 420_000);

  return {
    id: formatFlagId(sequence),
    ...entity,
    flagType,
    community: pickFrom(rng, COMMUNITIES),
    officerName: pickFrom(rng, OFFICERS),
    raisedAt: `2026-0${randomInt(rng, 4, 6)}-${String(randomInt(rng, 1, 28)).padStart(2, '0')}`,
    arrearsPesewas,
    status,
    weeksOverdue,
    activeMembers: entity.entityType === FLAG_ENTITY_TYPE.GROUP ? randomInt(rng, 6, 14) : undefined,
    totalMembers: entity.entityType === FLAG_ENTITY_TYPE.GROUP ? randomInt(rng, 12, 20) : undefined,
  };
}

function buildGeneratedFlags(rng: SeededRng, featured: RiskFlagSummary[]): RiskFlagSummary[] {
  const featuredCounts = countFlagsByType(featured);
  const generated: RiskFlagSummary[] = [];
  let sequence = 300;

  for (const flagType of Object.values(FLAG_TYPE)) {
    const remaining = Math.max(
      RISK_FLAGS_REFERENCE_TYPE_COUNTS[flagType] - featuredCounts[flagType],
      0,
    );

    for (let index = 0; index < remaining; index += 1) {
      sequence += 1;
      generated.push(
        generateFlag(rng, flagType, sequence, pickFrom(rng, GENERATED_STATUSES)),
      );
    }
  }

  return generated;
}

export function generateRiskFlagsDemoDataset(seed = RISK_FLAGS_DEMO_SEED): RiskFlagListResponse {
  const rng = createSeededRng(seed);
  const featured = [...MOCK_RISK_FLAGS];
  const generated = buildGeneratedFlags(rng, featured);
  const flags = [...featured, ...generated].sort(
    (left, right) => right.raisedAt.localeCompare(left.raisedAt) || right.id.localeCompare(left.id),
  );

  return buildRiskFlagListResponse(flags);
}

export function getRiskFlagsDemoDataset(): RiskFlagListResponse {
  if (!cachedResponse) {
    cachedResponse = generateRiskFlagsDemoDataset();
  }

  return cachedResponse;
}

export function resetRiskFlagsDemoDataset(): void {
  cachedResponse = null;
}

/** Test helper — verifies generated dataset matches reference type distribution. */
export function riskFlagsDatasetMatchesReference(dataset: RiskFlagListResponse): boolean {
  const typeCounts = countFlagsByType(dataset.flags);

  return (
    dataset.flags.length === RISK_FLAGS_REFERENCE_COUNT &&
    Object.values(FLAG_TYPE).every(
      (flagType) => typeCounts[flagType] === RISK_FLAGS_REFERENCE_TYPE_COUNTS[flagType],
    )
  );
}
