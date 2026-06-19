import { DASHBOARD_ALERT_CATEGORY_META } from '@/constants/dashboard-alerts';
import {
  DASHBOARD_DEMO_SEED,
  DASHBOARD_REFERENCE_BORROWER_SEGMENTS,
  DASHBOARD_REFERENCE_COLLECTOR_COUNT,
  DASHBOARD_REFERENCE_CYCLE_METRICS,
  DASHBOARD_REFERENCE_GROUP_COUNT,
  DASHBOARD_REFERENCE_GROUP_RISK_DISTRIBUTION,
  DASHBOARD_REFERENCE_KPIS,
  DASHBOARD_REFERENCE_TABLE_COLLECTORS,
} from '@/constants/dashboard-reference-scale';
import { BORROWER_STATUS } from '@/types/borrower';
import type {
  DashboardAlert,
  DashboardAlertCategory,
  DashboardCollectorPerformanceRow,
  DashboardCycleMetric,
  DashboardGroupRiskInput,
  DashboardGroupRiskLevel,
  DashboardKpi,
} from '@/types/dashboard';
import { LOAN_STATUS, type LoanPortfolioEntry } from '@/types/loan';
import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';
import type { BuildDashboardSummaryInput, DashboardBorrowerInput } from '@/utils/dashboard-summary';
import { createSeededRng, pickFrom, randomInt, type SeededRng } from '@/services/mock/factories/seeded-rng';

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
] as const;

const GROUP_PREFIXES = ['Sunrise', 'Hope', 'Grace', 'Unity', 'Tema', 'Madina', 'Osu', 'Labadi'] as const;
const GROUP_SUFFIXES = ['Women', 'Circle', 'Traders', 'Collective', 'Enterprise', 'Weavers'] as const;

const COMMUNITIES = ['Madina', 'Tema', 'Osu', 'Cantonments', 'Ashaiman', 'Labadi', 'Kumasi'] as const;

export interface DashboardDemoDataset extends BuildDashboardSummaryInput {
  referenceKpis: DashboardKpi[];
  referenceCycleMetrics: DashboardCycleMetric[];
  referenceCollectorPerformance: DashboardCollectorPerformanceRow[];
  referenceTableCollectorPerformance: DashboardCollectorPerformanceRow[];
  referenceAlerts: DashboardAlert[];
}

let cachedDataset: DashboardDemoDataset | null = null;

function generateGroupName(rng: SeededRng, index: number): string {
  if (index < GROUP_PREFIXES.length) {
    return `${GROUP_PREFIXES[index]} ${GROUP_SUFFIXES[index % GROUP_SUFFIXES.length]}`;
  }

  return `${pickFrom(rng, GROUP_PREFIXES)} ${pickFrom(rng, GROUP_SUFFIXES)} ${index + 1}`;
}

function generateGroupRiskInputs(rng: SeededRng): DashboardGroupRiskInput[] {
  const distribution: Array<{ level: DashboardGroupRiskLevel; count: number }> = [
    { level: 'LOW_RISK', count: DASHBOARD_REFERENCE_GROUP_RISK_DISTRIBUTION.low },
    { level: 'AT_RISK', count: DASHBOARD_REFERENCE_GROUP_RISK_DISTRIBUTION.atRisk },
    { level: 'FLAGGED', count: DASHBOARD_REFERENCE_GROUP_RISK_DISTRIBUTION.flagged },
    { level: 'SUSPENDED', count: DASHBOARD_REFERENCE_GROUP_RISK_DISTRIBUTION.suspended },
  ];

  const groups: DashboardGroupRiskInput[] = [];
  let index = 0;

  for (const entry of distribution) {
    for (let count = 0; count < entry.count; count += 1) {
      groups.push({
        groupName: generateGroupName(rng, index),
        riskLevel: entry.level,
      });
      index += 1;
    }
  }

  while (groups.length < DASHBOARD_REFERENCE_GROUP_COUNT) {
    groups.push({
      groupName: generateGroupName(rng, groups.length),
      riskLevel: 'LOW_RISK',
    });
  }

  return groups.slice(0, DASHBOARD_REFERENCE_GROUP_COUNT);
}

function generateBorrowerInputs(): DashboardBorrowerInput[] {
  const borrowers: DashboardBorrowerInput[] = [];
  let id = 0;
  const segments = DASHBOARD_REFERENCE_BORROWER_SEGMENTS;

  const pushMany = (count: number, status: DashboardBorrowerInput['status']) => {
    for (let index = 0; index < count; index += 1) {
      borrowers.push({ id: `demo-borrower-${id}`, status });
      id += 1;
    }
  };

  pushMany(segments.pending, BORROWER_STATUS.PENDING);
  pushMany(segments.blacklisted, BORROWER_STATUS.BLACKLISTED);

  const repaymentTotal = segments.active + segments.atRisk + segments.defaulted;
  for (let index = 0; index < repaymentTotal; index += 1) {
    borrowers.push({ id: `demo-borrower-${id}`, status: BORROWER_STATUS.APPROVED });
    id += 1;
  }

  return borrowers;
}

function generateLoansAndSchedules(
  rng: SeededRng,
  borrowers: DashboardBorrowerInput[],
): {
  loans: LoanPortfolioEntry[];
  schedulesByLoanId: Record<string, LoanScheduleWeek[]>;
} {
  const loans: LoanPortfolioEntry[] = [];
  const schedulesByLoanId: Record<string, LoanScheduleWeek[]> = {};
  const approvedBorrowers = borrowers.filter(
    (borrower) => borrower.status === BORROWER_STATUS.APPROVED,
  );

  const activeCount = DASHBOARD_REFERENCE_BORROWER_SEGMENTS.active;
  const atRiskCount = DASHBOARD_REFERENCE_BORROWER_SEGMENTS.atRisk;

  let outstandingRemaining = DASHBOARD_REFERENCE_KPIS.outstandingPesewas;

  approvedBorrowers.forEach((borrower, index) => {
    const loanId = `demo-loan-${index}`;
    const weeklyPaymentPesewas = randomInt(rng, 3_000, 8_000);
    const durationWeeks = randomInt(rng, 8, 24);
    const amountPesewas = weeklyPaymentPesewas * durationWeeks;
    let outstandingPesewas = Math.min(
      outstandingRemaining,
      Math.round(amountPesewas * (0.2 + rng() * 0.6)),
    );

    if (index === approvedBorrowers.length - 1) {
      outstandingPesewas = outstandingRemaining;
    }

    outstandingRemaining -= outstandingPesewas;

    const groupName = `Group ${randomInt(rng, 1, DASHBOARD_REFERENCE_GROUP_COUNT)}`;

    loans.push({
      id: loanId,
      borrowerId: borrower.id,
      borrowerName: `Borrower ${borrower.id.replace('demo-borrower-', '')}`,
      community: pickFrom(rng, COMMUNITIES),
      groupName,
      amountPesewas,
      outstandingPesewas: Math.max(outstandingPesewas, 0),
      weeklyPaymentPesewas,
      durationWeeks,
      status: LOAN_STATUS.ACTIVE,
      cycleBatch: 'Cycle 2 — April 2026',
      paymentDay: 'Friday',
      startDate: '2026-03-01',
    });

    const weeks: LoanScheduleWeek[] = Array.from({ length: durationWeeks }, (_, weekIndex) => {
      const weekNumber = weekIndex + 1;
      let status: LoanScheduleWeek['status'] = SCHEDULE_WEEK_STATUS.PAID;

      if (index >= activeCount && index < activeCount + atRiskCount) {
        status =
          weekIndex === durationWeeks - 1
            ? SCHEDULE_WEEK_STATUS.MISSED
            : SCHEDULE_WEEK_STATUS.PAID;
      } else if (index >= activeCount + atRiskCount) {
        status =
          weekIndex >= durationWeeks - 2
            ? SCHEDULE_WEEK_STATUS.MISSED
            : SCHEDULE_WEEK_STATUS.PAID;
      }

      return {
        weekNumber,
        dueDate: `2026-05-${String((weekIndex % 28) + 1).padStart(2, '0')}`,
        status,
        amountPesewas: weeklyPaymentPesewas,
      };
    });

    schedulesByLoanId[loanId] = weeks;
  });

  return { loans, schedulesByLoanId };
}

function generateCollectorNames(
  rng: SeededRng,
  count: number,
  exclude: ReadonlySet<string> = new Set(),
): string[] {
  const names: string[] = [];

  while (names.length < count) {
    const name = `${pickFrom(rng, COLLECTOR_FIRST_NAMES)} ${pickFrom(rng, COLLECTOR_LAST_NAMES)}`;

    if (!exclude.has(name) && !names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}

function buildReferenceTableCollectors(): DashboardCollectorPerformanceRow[] {
  return DASHBOARD_REFERENCE_TABLE_COLLECTORS.map((collector, index) => ({
    collectorId: `demo-collector-${index + 1}`,
    name: collector.name,
    expectedPesewas: collector.expectedPesewas,
    actualPesewas: collector.actualPesewas,
    collectionRatePercent: collector.collectionRatePercent,
    variancePesewas: collector.variancePesewas,
  }));
}

function generateCollectorPerformance(rng: SeededRng): DashboardCollectorPerformanceRow[] {
  const pinned = buildReferenceTableCollectors();
  const remainingCount = DASHBOARD_REFERENCE_COLLECTOR_COUNT - pinned.length;
  const pinnedNames = new Set(pinned.map((collector) => collector.name));
  const names = generateCollectorNames(rng, remainingCount, pinnedNames);
  const totalExpected = DASHBOARD_REFERENCE_KPIS.collectedPesewas * 1.08;

  const generated = names.map((name, index) => {
    const collectorId = `demo-collector-${pinned.length + index + 1}`;
    const weight = 0.5 + rng();
    const expectedPesewas = Math.round((totalExpected / DASHBOARD_REFERENCE_COLLECTOR_COUNT) * weight);
    const rateBase = randomInt(rng, 64, 99);
    const collectionRatePercent = rateBase + rng() * 0.9;
    const actualPesewas = Math.round((expectedPesewas * collectionRatePercent) / 100);
    const variancePesewas = actualPesewas - expectedPesewas;

    return {
      collectorId,
      name,
      expectedPesewas,
      actualPesewas,
      collectionRatePercent: Math.round(collectionRatePercent * 10) / 10,
      variancePesewas,
    };
  });

  return [...pinned, ...generated];
}

function generateTransactions(
  loans: LoanPortfolioEntry[],
  collectorPerformance: DashboardCollectorPerformanceRow[],
): FinancialTransaction[] {
  const transactions: FinancialTransaction[] = [];
  let txnId = 1;

  const pushTxn = (entry: Omit<FinancialTransaction, 'id'>) => {
    transactions.push({ ...entry, id: `demo-txn-${txnId}` });
    txnId += 1;
  };

  let disbursedRemaining = DASHBOARD_REFERENCE_KPIS.disbursedPesewas;
  loans.forEach((loan, index) => {
    const collectorId =
      collectorPerformance[index % collectorPerformance.length]?.collectorId ?? 'demo-collector-1';
    const amount =
      index === loans.length - 1
        ? disbursedRemaining
        : Math.round(loan.amountPesewas * (0.85 + (index % 5) * 0.02));

    disbursedRemaining -= amount;

    pushTxn({
      type: TRANSACTION_TYPE.DISBURSEMENT,
      borrowerId: loan.borrowerId,
      loanId: loan.id,
      amountPesewas: amount,
      collectorId,
      recordedAt: `2026-04-${String((index % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
    });
  });

  let collectedRemaining = DASHBOARD_REFERENCE_KPIS.collectedPesewas;
  collectorPerformance.forEach((collector, index) => {
    const amount =
      index === collectorPerformance.length - 1
        ? collectedRemaining
        : collector.actualPesewas;

    collectedRemaining -= amount;

    pushTxn({
      type: TRANSACTION_TYPE.REPAYMENT,
      borrowerId: `demo-borrower-${index}`,
      loanId: `demo-loan-${index % loans.length}`,
      amountPesewas: amount,
      collectorId: collector.collectorId,
      recordedAt: `2026-06-08T0${index % 9}:3${index % 6}:00.000Z`,
    });
  });

  return transactions;
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function buildReferenceAlerts(): DashboardAlert[] {
  const templates: Array<{
    category: DashboardAlertCategory;
    message: string;
    entityRef?: string;
    href?: string;
    minutesAgo: number;
  }> = [
    {
      category: 'MISSED_PAYMENT',
      message: 'Missed payment — Ama Kusi (2 weeks)',
      entityRef: 'borrower-demo-42',
      minutesAgo: 3,
    },
    {
      category: 'RECONCILIATION_VARIANCE',
      message: 'Reconciliation variance — Yaw Owusu (GHS 1,200 pending)',
      entityRef: 'collector-demo-7',
      minutesAgo: 8,
    },
    {
      category: 'LOAN_APPROVED',
      message: 'Loan approved — Efua Mensah (GHS 2,400)',
      entityRef: 'loan-demo-118',
      minutesAgo: 14,
    },
    {
      category: 'LOAN_REJECTED',
      message: 'Loan rejected — Adjoa Serwaa (incomplete guarantor)',
      entityRef: 'application-demo-31',
      minutesAgo: 22,
    },
    {
      category: 'DUPLICATE_REGISTRATION_BLOCKED',
      message: 'Duplicate registration blocked — phone +233244222333',
      entityRef: 'registration-demo-88',
      minutesAgo: 31,
    },
    {
      category: 'POOL_REPLENISHED',
      message: 'Pool replenished — Operating Pool (+GHS 250,000)',
      entityRef: 'pool-operating',
      minutesAgo: 45,
    },
    {
      category: 'BORROWER_BLACKLISTED',
      message: 'Borrower blacklisted — Yaa Darko (repeat default)',
      entityRef: 'borrower-blacklisted-001',
      minutesAgo: 58,
    },
    {
      category: 'COLLECTOR_BELOW_THRESHOLD',
      message: 'Collector below threshold — Akosua Poku (64.4% rate)',
      entityRef: 'collector-demo-12',
      minutesAgo: 72,
    },
    {
      category: 'GROUP_ESCALATED',
      message: 'Group escalated — Adwoa Nhyira Group (3 missed cycles)',
      entityRef: 'GRP-0041',
      href: '/groups/GRP-0041',
      minutesAgo: 95,
    },
    {
      category: 'RISK_FLAG_TRIGGERED',
      message: 'Risk flag triggered — Cantonments Circle (arrears spike)',
      entityRef: 'risk-flag-demo-19',
      minutesAgo: 110,
    },
    {
      category: 'AUDIT_WARNING',
      message: 'Audit warning — manual adjustment pending approval',
      entityRef: 'audit-demo-501',
      minutesAgo: 125,
    },
    {
      category: 'SAME_DAY_EDIT_WARNING',
      message: 'Same-day edit — Loan LN-004821 amount modified',
      entityRef: 'loan-demo-821',
      minutesAgo: 138,
    },
  ];

  return templates.map((template, index) => {
    const meta = DASHBOARD_ALERT_CATEGORY_META[template.category];

    return {
      id: `demo-alert-${index + 1}`,
      severity: meta.defaultSeverity,
      category: template.category,
      message: template.message,
      createdAt: minutesAgo(template.minutesAgo),
      icon: meta.icon,
      entityRef: template.entityRef,
      href: template.href ?? meta.defaultHref,
    };
  });
}

function buildReferenceKpis(): DashboardKpi[] {
  return [
    {
      id: 'pool',
      label: 'Total Pool Funds',
      amountPesewas: DASHBOARD_REFERENCE_KPIS.poolPesewas,
      trendLabel: DASHBOARD_REFERENCE_KPIS.poolTrendLabel,
      trendDirection: 'up',
      trendTone: 'success',
      valueTone: 'gold',
    },
    {
      id: 'disbursed',
      label: 'Total Disbursed',
      amountPesewas: DASHBOARD_REFERENCE_KPIS.disbursedPesewas,
      trendLabel: DASHBOARD_REFERENCE_KPIS.disbursedTrendLabel,
      trendDirection: 'up',
      trendTone: 'success',
      valueTone: 'gold',
    },
    {
      id: 'collected',
      label: 'Total Collected',
      amountPesewas: DASHBOARD_REFERENCE_KPIS.collectedPesewas,
      trendLabel: DASHBOARD_REFERENCE_KPIS.collectedTrendLabel,
      trendDirection: 'up',
      trendTone: 'success',
      valueTone: 'success',
    },
    {
      id: 'outstanding',
      label: 'Total Outstanding',
      amountPesewas: DASHBOARD_REFERENCE_KPIS.outstandingPesewas,
      trendLabel: DASHBOARD_REFERENCE_KPIS.outstandingTrendLabel,
      trendDirection: 'up',
      trendTone: 'danger',
      valueTone: 'danger',
    },
  ];
}

function buildReferenceCycleMetrics(): DashboardCycleMetric[] {
  const cycle = DASHBOARD_REFERENCE_CYCLE_METRICS;

  return [
    { label: 'Active Groups', value: String(cycle.activeGroups) },
    { label: 'New Loans (MTD)', value: String(cycle.newLoansMtd) },
    {
      label: 'Avg Loan Size',
      value: new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(
        cycle.avgLoanPesewas / 100,
      ),
    },
    { label: 'Repayment Rate', value: `${cycle.repaymentRatePercent}%` },
    { label: 'Pending Applications', value: String(cycle.pendingApplications) },
    { label: 'Overdue > 30D', value: String(cycle.overdueOver30d) },
  ];
}

export function generateDashboardDemoDataset(seed = DASHBOARD_DEMO_SEED): DashboardDemoDataset {
  const rng = createSeededRng(seed);
  const borrowers = generateBorrowerInputs();
  const groupRisk = generateGroupRiskInputs(rng);
  const collectorPerformance = generateCollectorPerformance(rng);
  const { loans, schedulesByLoanId } = generateLoansAndSchedules(rng, borrowers);
  const transactions = generateTransactions(loans, collectorPerformance);
  const referenceAlerts = buildReferenceAlerts();

  return {
    borrowers,
    loans,
    transactions,
    groupRisk,
    schedulesByLoanId,
    referenceDate: '2026-06-08',
    referenceKpis: buildReferenceKpis(),
    referenceCycleMetrics: buildReferenceCycleMetrics(),
    referenceCollectorPerformance: collectorPerformance,
    referenceTableCollectorPerformance: buildReferenceTableCollectors(),
    referenceAlerts,
  };
}

export function getDashboardDemoDataset(): DashboardDemoDataset {
  if (!cachedDataset) {
    cachedDataset = generateDashboardDemoDataset();
  }

  return cachedDataset;
}

export function resetDashboardDemoDataset(): void {
  cachedDataset = null;
}
