import {
  FLAG_ENTITY_TYPE,
  FLAG_STATUS,
  FLAG_TYPE,
  type FlagTimelineEvent,
  type FlagType,
  type RiskFlagListResponse,
  type RiskFlagSummary,
} from '@/types/risk-flag';

const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  [FLAG_TYPE.MISSED_PAYMENT]: 'Missed Payment',
  [FLAG_TYPE.DEFAULT]: 'Default',
  [FLAG_TYPE.FRAUD_SUSPICION]: 'Fraud Suspicion',
  [FLAG_TYPE.DUPLICATE_ID]: 'Duplicate ID',
  [FLAG_TYPE.BLACKLISTED]: 'Blacklisted',
};

const OPEN_STATUSES: ReadonlySet<RiskFlagSummary['status']> = new Set([
  FLAG_STATUS.OPEN,
  FLAG_STATUS.CRITICAL,
  FLAG_STATUS.UNDER_REVIEW,
]);

const BLACKLIST_REASONS: Record<FlagType, string> = {
  [FLAG_TYPE.MISSED_PAYMENT]: 'Repeated missed payments',
  [FLAG_TYPE.DEFAULT]: 'Loan default — group exposure',
  [FLAG_TYPE.FRAUD_SUSPICION]: 'Fraud — duplicate application',
  [FLAG_TYPE.DUPLICATE_ID]: 'Identity verification failed',
  [FLAG_TYPE.BLACKLISTED]: 'Manual blacklist decision',
};

function summarizeRiskFlags(flags: RiskFlagSummary[]): RiskFlagListResponse['summary'] {
  const openFlags = flags.filter((flag) => OPEN_STATUSES.has(flag.status)).length;
  const blacklisted = flags.filter((flag) => flag.flagType === FLAG_TYPE.BLACKLISTED).length;
  const outstandingArrearsPesewas = flags
    .filter((flag) => OPEN_STATUSES.has(flag.status))
    .reduce((total, flag) => total + flag.arrearsPesewas, 0);
  const highRiskBorrowers = new Set(
    flags
      .filter(
        (flag) =>
          flag.entityType === FLAG_ENTITY_TYPE.BORROWER &&
          (flag.status === FLAG_STATUS.CRITICAL || (flag.weeksOverdue ?? 0) >= 3),
      )
      .map((flag) => flag.entityId),
  ).size;

  return {
    openFlags,
    blacklisted,
    outstandingArrearsPesewas,
    highRiskBorrowers,
  };
}

function summarizeTypeBreakdown(flags: RiskFlagSummary[]): RiskFlagListResponse['typeBreakdown'] {
  return Object.values(FLAG_TYPE).map((flagType) => ({
    flagType,
    label: FLAG_TYPE_LABELS[flagType],
    count: flags.filter((flag) => flag.flagType === flagType).length,
  }));
}

function summarizeRecentBlacklists(
  flags: RiskFlagSummary[],
): RiskFlagListResponse['recentBlacklists'] {
  return flags
    .filter((flag) => flag.flagType === FLAG_TYPE.BLACKLISTED)
    .sort((left, right) => right.raisedAt.localeCompare(left.raisedAt))
    .slice(0, 3)
    .map((flag) => ({
      id: flag.id,
      name: flag.entityName,
      reason:
        flag.weeksOverdue && flag.weeksOverdue >= 3
          ? `${flag.weeksOverdue} consecutive defaults`
          : BLACKLIST_REASONS[flag.flagType],
      blacklistedAt: flag.raisedAt,
    }));
}

export function buildRiskFlagListResponse(flags: RiskFlagSummary[]): RiskFlagListResponse {
  return {
    generatedAt: new Date().toISOString(),
    summary: summarizeRiskFlags(flags),
    flags,
    typeBreakdown: summarizeTypeBreakdown(flags),
    recentBlacklists: summarizeRecentBlacklists(flags),
  };
}

export function buildDefaultFlagTimeline(flag: RiskFlagSummary): FlagTimelineEvent[] {
  return [
    {
      id: 'tl-raised',
      message: `Flag raised — ${flag.weeksOverdue ?? 1} week(s) missed`,
      recordedAt: `${flag.raisedAt}T08:00:00.000Z`,
    },
    {
      id: 'tl-sms',
      message: 'Collector notified via SMS',
      recordedAt: `${flag.raisedAt}T09:15:00.000Z`,
    },
    {
      id: 'tl-visit',
      message: 'Field visit scheduled',
      recordedAt: `${flag.raisedAt}T11:00:00.000Z`,
    },
  ];
}
