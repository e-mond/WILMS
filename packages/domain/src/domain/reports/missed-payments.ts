import type { BorrowerRecord, PaymentRecord } from '../../db/store.js';
import { mapLoanRowToDetail } from '../loan/mappers.js';
import type { loans } from '../../db/schema/loans.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';

export interface MissedPaymentReportRow {
  id: string;
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  groupName: string;
  missedWeeks: number;
  outstandingPesewas: number;
  lastPaymentDate?: string;
  loanStatus: string;
}

export interface MissedPaymentReport {
  generatedAt: string;
  summary: { totalMissedBorrowers: number; totalOutstandingPesewas: number };
  rows: MissedPaymentReportRow[];
}

function lastPaymentDate(borrowerId: string, payments: PaymentRecord[]): string | undefined {
  const loanPayments = payments
    .filter((payment) => payment.borrowerId === borrowerId)
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate));

  return loanPayments[0]?.paymentDate;
}

async function countMissedWeeks(loanId: string): Promise<number> {
  try {
    const weeks = await scheduleRepo.listScheduleWeeks(loanId);
    return weeks.filter((week) => week.status === 'MISSED').length;
  } catch {
    return 0;
  }
}

export async function buildMissedPaymentReport(input: {
  loanRows: Array<typeof loans.$inferSelect>;
  borrowers: BorrowerRecord[];
  payments: PaymentRecord[];
}): Promise<MissedPaymentReport> {
  const borrowerById = new Map(input.borrowers.map((borrower) => [borrower.id, borrower]));
  const activeLoans = input.loanRows.filter((row) => row.externalStatus === 'ACTIVE');

  const rows: MissedPaymentReportRow[] = [];
  for (const row of activeLoans) {
    const missedWeeks = await countMissedWeeks(row.id);
    if (missedWeeks <= 0) continue;

    const detail = mapLoanRowToDetail(row);
    const borrower = borrowerById.get(row.borrowerId);

    rows.push({
      id: `missed-${detail.id}`,
      loanId: detail.id,
      borrowerId: detail.borrowerId,
      borrowerName: borrower?.fullName ?? 'Unknown borrower',
      community: borrower?.community ?? '—',
      groupName: borrower?.groupName ?? '—',
      missedWeeks,
      outstandingPesewas: detail.outstandingPesewas,
      lastPaymentDate: lastPaymentDate(detail.borrowerId, input.payments),
      loanStatus: row.externalStatus,
    });
  }

  const totalOutstandingPesewas = rows.reduce((total, row) => total + row.outstandingPesewas, 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMissedBorrowers: rows.length,
      totalOutstandingPesewas,
    },
    rows,
  };
}
