import {
  COLLECTORS_DEMO_SEED,
  COLLECTORS_REFERENCE_COUNT,
  COLLECTORS_REFERENCE_FEATURED_COLLECTOR,
  COLLECTORS_REFERENCE_RATE_DISTRIBUTION,
  COLLECTORS_REFERENCE_SUMMARY,
} from '@/constants/collectors-reference-scale';
import {
  COLLECTOR_STATUS,
  type CollectorAlert,
  type CollectorListResponse,
  type CollectorSummary,
} from '@/types/collector-management';
import { createSeededRng, pickFrom, randomInt, type SeededRng } from '@/services/mock/factories/seeded-rng';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';

const COLLECTOR_FIRST_NAMES = [
  'Kwame',
  'Ama',
  'Abena',
  'Kofi',
  'Efua',
  'Yaw',
  'Akosua',
  'Esi',
  'Grace',
  'Maame',
  'Adwoa',
  'Nana',
  'Serwaa',
  'Adjoa',
] as const;

const COLLECTOR_LAST_NAMES = [
  'Asante',
  'Mensah',
  'Osei',
  'Boateng',
  'Owusu',
  'Kwarteng',
  'Darko',
  'Adjei',
  'Serwaa',
  'Nyarko',
  'Amponsah',
  'Tetteh',
  'Agyeman',
  'Sarpong',
] as const;

const COLLECTOR_ZONES = [
  'Madina, Accra',
  'Tema Comm. 5',
  'Osu, Accra',
  'Ashaiman',
  'Labadi',
  'Cantonments',
  'Kumasi Central',
  'Teshie',
] as const;

/** Pre-tuned rates: 14 top / 14 on-track / 6 below 70 → avg 84.2%. */
const REFERENCE_COLLECTION_RATES = [
  100, 96, 98, 97, 96, 95, 94, 93, 92, 91, 90, 96, 97, 99,
  86, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75,
  66, 67, 65, 63, 61, 58,
] as const;

let cachedResponse: CollectorListResponse | null = null;

function formatCollectorId(index: number): string {
  return `COL-${String(index + 1).padStart(3, '0')}`;
}

function generateUniqueNames(rng: SeededRng, count: number, exclude: ReadonlySet<string>): string[] {
  const names: string[] = [];

  while (names.length < count) {
    const name = `${pickFrom(rng, COLLECTOR_FIRST_NAMES)} ${pickFrom(rng, COLLECTOR_LAST_NAMES)}`;

    if (!exclude.has(name) && !names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}

function buildMonthlyPerformance(rate: number) {
  return [
    { monthLabel: 'Dec', collectionRatePercent: Math.max(rate - 12, 0) },
    { monthLabel: 'Jan', collectionRatePercent: Math.max(rate - 9, 0) },
    { monthLabel: 'Feb', collectionRatePercent: Math.max(rate - 7, 0) },
    { monthLabel: 'Mar', collectionRatePercent: Math.max(rate - 5, 0) },
    { monthLabel: 'Apr', collectionRatePercent: Math.max(rate - 2, 0) },
    { monthLabel: 'May', collectionRatePercent: rate },
  ];
}

function buildCollectorAlerts(): CollectorAlert[] {
  return [
    {
      id: 'collector-alert-1',
      severity: 'danger',
      message: 'COL-021 (Yaw Owusu) below 70% for the 2nd consecutive week',
      createdAt: '2026-06-08T08:15:00.000Z',
    },
    {
      id: 'collector-alert-2',
      severity: 'warning',
      message: 'COL-017 missed GPS check-in today',
      createdAt: '2026-06-08T07:40:00.000Z',
    },
    {
      id: 'collector-alert-3',
      severity: 'success',
      message: 'COL-024 (Esi Amponsah) reached a 7-week streak',
      createdAt: '2026-06-08T06:05:00.000Z',
    },
  ];
}

function buildReferenceCollectors(rng: SeededRng): CollectorSummary[] {
  const featuredIndex = 10;
  const exclude = new Set<string>([COLLECTORS_REFERENCE_FEATURED_COLLECTOR.displayName]);
  const generatedNames = generateUniqueNames(rng, COLLECTORS_REFERENCE_COUNT - 1, exclude);
  let nameIndex = 0;

  return Array.from({ length: COLLECTORS_REFERENCE_COUNT }, (_, index) => {
    const isFeatured = index === featuredIndex;
    const rate = isFeatured
      ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.collectionRatePercent
      : REFERENCE_COLLECTION_RATES[index];

    const displayName = isFeatured
      ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.displayName
      : generatedNames[nameIndex++]!;

    const expectedPesewas = isFeatured
      ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.expectedPesewas
      : randomInt(rng, 2_800_000, 5_200_000);
    const collectedPesewas = isFeatured
      ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.collectedPesewas
      : Math.round((expectedPesewas * rate) / 100);

    const monthlyPerformance = buildMonthlyPerformance(rate);
    const isActive = index < COLLECTORS_REFERENCE_SUMMARY.activeToday;

    return {
      id: formatCollectorId(index),
      displayName,
      photoUrl: resolvePersonPhotoUrl({ name: displayName, id: formatCollectorId(index) }),
      zone: isFeatured
        ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.zone
        : pickFrom(rng, COLLECTOR_ZONES),
      groupCount: isFeatured
        ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.groupCount
        : randomInt(rng, 6, 14),
      borrowerCount: isFeatured
        ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.borrowerCount
        : randomInt(rng, 90, 220),
      expectedPesewas,
      collectedPesewas,
      collectionRatePercent: rate,
      recoveryRatePercent: Math.min(100, rate + randomInt(rng, 1, 5)),
      reconciliationCount: Math.max(1, Math.floor((isFeatured ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.streakWeeks : rate >= 70 ? randomInt(rng, 4, 14) : randomInt(rng, 1, 6)) / 2)),
      expensesSubmittedCount: isFeatured ? 9 : randomInt(rng, 4, 12),
      status: isActive ? COLLECTOR_STATUS.ACTIVE : COLLECTOR_STATUS.AWAY,
      streakWeeks: isFeatured
        ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.streakWeeks
        : rate >= 90
          ? randomInt(rng, 3, 8)
          : rate >= 70
            ? randomInt(rng, 1, 4)
            : 0,
      cycleLabel: isFeatured ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.cycleLabel : 'Jun 2026',
      joinedAt: isFeatured
        ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.joinedAt
        : `202${randomInt(rng, 0, 3)}-${String(randomInt(rng, 1, 12)).padStart(2, '0')}-01`,
      lastActiveAt: isFeatured
        ? COLLECTORS_REFERENCE_FEATURED_COLLECTOR.lastActiveAt
        : `2026-06-0${randomInt(rng, 1, 8)}T${String(randomInt(rng, 8, 17)).padStart(2, '0')}:30:00.000Z`,
      rateTrend: monthlyPerformance.map((entry) => entry.collectionRatePercent),
      monthlyPerformance,
    };
  });
}

function summarizeCollectors(collectors: CollectorSummary[]): CollectorListResponse['summary'] {
  const avgCollectionRatePercent =
    collectors.length === 0
      ? 0
      : Math.round(
          (collectors.reduce((total, collector) => total + collector.collectionRatePercent, 0) /
            collectors.length) *
            10,
        ) / 10;

  return {
    totalCollectors: collectors.length,
    avgCollectionRatePercent,
    belowSeventyPercent: collectors.filter((collector) => collector.collectionRatePercent < 70)
      .length,
    activeToday: collectors.filter((collector) => collector.status === COLLECTOR_STATUS.ACTIVE)
      .length,
  };
}

function summarizeRateDistribution(
  collectors: CollectorSummary[],
): CollectorListResponse['rateDistribution'] {
  return collectors.reduce(
    (counts, collector) => {
      if (collector.collectionRatePercent >= 90) {
        counts.topPerformers += 1;
      } else if (collector.collectionRatePercent >= 70) {
        counts.onTrack += 1;
      } else {
        counts.needsAttention += 1;
      }

      return counts;
    },
    { topPerformers: 0, onTrack: 0, needsAttention: 0 },
  );
}

export function generateCollectorsDemoDataset(seed = COLLECTORS_DEMO_SEED): CollectorListResponse {
  const rng = createSeededRng(seed);
  const collectors = buildReferenceCollectors(rng);

  return {
    generatedAt: '2026-06-08T12:00:00.000Z',
    summary: summarizeCollectors(collectors),
    rateDistribution: summarizeRateDistribution(collectors),
    collectors,
    alerts: buildCollectorAlerts(),
  };
}

export function getCollectorsDemoDataset(): CollectorListResponse {
  if (!cachedResponse) {
    cachedResponse = generateCollectorsDemoDataset();
  }

  return cachedResponse;
}

export function resetCollectorsDemoDataset(): void {
  cachedResponse = null;
}

/** Test helper — verifies generated dataset matches reference targets. */
export function collectorsDatasetMatchesReference(dataset: CollectorListResponse): boolean {
  return (
    dataset.collectors.length === COLLECTORS_REFERENCE_COUNT &&
    dataset.summary.totalCollectors === COLLECTORS_REFERENCE_SUMMARY.totalCollectors &&
    dataset.summary.avgCollectionRatePercent ===
      COLLECTORS_REFERENCE_SUMMARY.avgCollectionRatePercent &&
    dataset.summary.belowSeventyPercent === COLLECTORS_REFERENCE_SUMMARY.belowSeventyPercent &&
    dataset.summary.activeToday === COLLECTORS_REFERENCE_SUMMARY.activeToday &&
    dataset.rateDistribution.topPerformers ===
      COLLECTORS_REFERENCE_RATE_DISTRIBUTION.topPerformers &&
    dataset.rateDistribution.onTrack === COLLECTORS_REFERENCE_RATE_DISTRIBUTION.onTrack &&
    dataset.rateDistribution.needsAttention ===
      COLLECTORS_REFERENCE_RATE_DISTRIBUTION.needsAttention
  );
}
