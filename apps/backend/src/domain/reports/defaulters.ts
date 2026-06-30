import type { BorrowerRecord, PaymentRecord } from '../../db/store.js';
import { mapLoanRowToDetail } from '../loan/mappers.js';
import type { loans } from '../../db/schema/loans.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';

export interface DefaulterReportRow {
  id: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  groupName: string;
  missedWeeks: number;
  outstandingPesewas: number;
  lastPaymentDate?: string;
}

export interface DefaulterReport {
  generatedAt: string;
  summary: { totalDefaulters: number; totalOutstandingPesewas: number };
  rows: DefaulterReportRow[];
}

function lastPaymentDate(
  loanId: string,
  borrowerId: string,
  payments: PaymentRecord[],
): string | undefined {
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

export async function buildDefaulterReport(input: {
  loanRows: Array<typeof loans.$inferSelect>;
  borrowers: BorrowerRecord[];
  payments: PaymentRecord[];
  referenceDate?: string;
}): Promise<DefaulterReport> {
  const borrowerById = new Map(input.borrowers.map((borrower) => [borrower.id, borrower]));
  const defaultedLoans = input.loanRows.filter((row) => row.externalStatus === 'DEFAULTED');

  const rows: DefaulterReportRow[] = await Promise.all(
    defaultedLoans.map(async (row) => {
      const detail = mapLoanRowToDetail(row);
      const borrower = borrowerById.get(row.borrowerId);

      return {
        id: `def-${detail.id}`,
        borrowerId: detail.borrowerId,
        borrowerName: borrower?.fullName ?? 'Unknown borrower',
        community: borrower?.community ?? '—',
        groupName: borrower?.groupName ?? '—',
        missedWeeks: await countMissedWeeks(detail.id),
        outstandingPesewas: detail.outstandingPesewas,
        lastPaymentDate: lastPaymentDate(detail.id, detail.borrowerId, input.payments),
      };
    }),
  );

  const totalOutstandingPesewas = rows.reduce((total, row) => total + row.outstandingPesewas, 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalDefaulters: rows.length,
      totalOutstandingPesewas,
    },
    rows,
  };
}
