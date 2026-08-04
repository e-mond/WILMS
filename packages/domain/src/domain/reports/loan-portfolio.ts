const LOAN_STATUS_ACTIVE = 'ACTIVE';

export interface LoanPortfolioEntry {
  id: string;
  displayId: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  groupName: string;
  amountPesewas: number;
  outstandingPesewas: number;
  weeklyPaymentPesewas: number;
  durationWeeks: number;
  status: string;
  cycleBatch: string;
  paymentDay: string;
  startDate: string;
}

export interface LoanPortfolioSummary {
  totalLoans: number;
  activeLoans: number;
  totalDisbursedPesewas: number;
  totalOutstandingPesewas: number;
}

export interface LoanPortfolioReportParams {
  search?: string;
  status?: string;
  cycleBatch?: string;
}

export interface LoanPortfolioReport {
  generatedAt: string;
  summary: LoanPortfolioSummary;
  entries: LoanPortfolioEntry[];
}

function filterPortfolioEntries(
  entries: LoanPortfolioEntry[],
  params: LoanPortfolioReportParams,
): LoanPortfolioEntry[] {
  const normalizedQuery = (params.search ?? '').trim().toLowerCase();

  return entries.filter((entry) => {
    const matchesStatus = !params.status || entry.status === params.status;
    const matchesCycle = !params.cycleBatch || entry.cycleBatch === params.cycleBatch;
    const matchesSearch =
      !normalizedQuery ||
      entry.borrowerName.toLowerCase().includes(normalizedQuery) ||
      entry.community.toLowerCase().includes(normalizedQuery) ||
      entry.groupName.toLowerCase().includes(normalizedQuery) ||
      entry.id.toLowerCase().includes(normalizedQuery) ||
      entry.displayId.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesCycle && matchesSearch;
  });
}

function summarizePortfolioEntries(entries: LoanPortfolioEntry[]): LoanPortfolioSummary {
  return entries.reduce<LoanPortfolioSummary>(
    (summary, entry) => ({
      totalLoans: summary.totalLoans + 1,
      activeLoans: summary.activeLoans + (entry.status === LOAN_STATUS_ACTIVE ? 1 : 0),
      totalDisbursedPesewas: summary.totalDisbursedPesewas + entry.amountPesewas,
      totalOutstandingPesewas: summary.totalOutstandingPesewas + entry.outstandingPesewas,
    }),
    {
      totalLoans: 0,
      activeLoans: 0,
      totalDisbursedPesewas: 0,
      totalOutstandingPesewas: 0,
    },
  );
}

export function buildLoanPortfolioReport(
  entries: LoanPortfolioEntry[],
  params: LoanPortfolioReportParams = {},
): LoanPortfolioReport {
  const filtered = filterPortfolioEntries(entries, params);

  return {
    generatedAt: new Date().toISOString(),
    summary: summarizePortfolioEntries(filtered),
    entries: filtered,
  };
}
