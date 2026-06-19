/** Target values derived from GroupsManagement.jpeg (authoritative reference). */

export const GROUPS_DEMO_SEED = 2_026_051_4;

export const GROUPS_REFERENCE_COUNT = 148;

export const GROUPS_REFERENCE_SUMMARY = {
  activeGroups: GROUPS_REFERENCE_COUNT,
  totalMembers: 2_416,
  flaggedOrSuspended: 19,
  avgCollectionRatePercent: 84.2,
} as const;

export const GROUPS_REFERENCE_RISK_DISTRIBUTION = {
  lowRisk: 101,
  atRisk: 31,
  flagged: 11,
  suspended: 5,
} as const;

/** Featured group row from the reference image (GRP-0041). */
export const GROUPS_REFERENCE_FEATURED_GROUP = {
  id: 'GRP-0041',
  name: 'Adwoa Nhyira Group',
  community: 'Madina, Accra',
  officerName: 'Abena Owusu',
  leaderName: 'Adwoa Nhyira',
  formedAt: '2024-03-12',
  memberCount: 14,
  activeMemberCount: 12,
  disbursedPesewas: 2_480_000,
  collectedPesewas: 2_040_000,
  collectionRatePercent: 82,
} as const;

export const GROUPS_REFERENCE_PAGE_SIZE = 8;
