/** Target values derived from CollectorsManagement.jpeg (authoritative reference). */

export const COLLECTORS_DEMO_SEED = 2_026_050_9;

export const COLLECTORS_REFERENCE_COUNT = 34;

export const COLLECTORS_REFERENCE_SUMMARY = {
  totalCollectors: COLLECTORS_REFERENCE_COUNT,
  avgCollectionRatePercent: 84.2,
  belowSeventyPercent: 6,
  activeToday: 28,
} as const;

export const COLLECTORS_REFERENCE_RATE_DISTRIBUTION = {
  topPerformers: 14,
  onTrack: 14,
  needsAttention: 6,
} as const;

/** Featured collector row from the reference image (COL-011). */
export const COLLECTORS_REFERENCE_FEATURED_COLLECTOR = {
  id: 'COL-011',
  displayName: 'Kwame Asante',
  zone: 'Madina, Accra',
  groupCount: 12,
  borrowerCount: 204,
  expectedPesewas: 5_000_000,
  collectedPesewas: 5_200_000,
  collectionRatePercent: 100,
  streakWeeks: 5,
  cycleLabel: 'Jun 2026',
  joinedAt: '2022-02-14',
  lastActiveAt: '2026-06-08T09:42:00.000Z',
} as const;

export const COLLECTOR_ZONE_OPTIONS = [
  'Madina, Accra',
  'Tema Comm. 5',
  'Osu, Accra',
  'Ashaiman',
  'Labadi',
  'Cantonments',
  'Kumasi Central',
  'Teshie',
] as const;

/** Fallback expected amount when transaction history is empty (legacy search/performance helpers). */
export const COLLECTOR_EXPECTED_PESEWAS_FALLBACK = 2_800_000;
