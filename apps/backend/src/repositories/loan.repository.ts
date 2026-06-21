import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { loans } from '../db/schema/loans.js';
import { LOAN_LIFECYCLE, toExternalStatus } from '../domain/loan/lifecycle.js';
import { pesewasToDecimal } from '../domain/money.js';

export interface CreateLoanRecordInput {
  borrowerId: string;
  amountPesewas: number;
  durationWeeks: number;
  weeklyPaymentPesewas: number;
  paymentDay: string;
  startDate: string;
  cycleBatch: string;
  createdByUserId: string;
}

export async function insertLoan(input: CreateLoanRecordInput, tx: WilmsDb = getDb()) {
  const id = uuidv7();
  const principal = pesewasToDecimal(input.amountPesewas);
  const installment = pesewasToDecimal(input.weeklyPaymentPesewas);

  const [row] = await tx
    .insert(loans)
    .values({
      id,
      borrowerId: input.borrowerId,
      lifecycleStatus: LOAN_LIFECYCLE.PENDING_DISBURSEMENT,
      externalStatus: toExternalStatus(LOAN_LIFECYCLE.PENDING_DISBURSEMENT),
      principalAmount: principal,
      approvedAmount: principal,
      disbursedAmount: '0',
      installmentAmount: installment,
      loanBalance: principal,
      durationWeeks: input.durationWeeks,
      paymentDay: input.paymentDay,
      startDate: input.startDate,
      cycleBatch: input.cycleBatch,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  return row!;
}

export async function findLoanById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx.select().from(loans).where(eq(loans.id, id)).limit(1);
  return row && !row.deletedAt ? row : undefined;
}

export async function listLoans(filter?: { externalStatus?: string }, tx: WilmsDb = getDb()) {
  const conditions = [isNull(loans.deletedAt)];
  if (filter?.externalStatus) {
    conditions.push(eq(loans.externalStatus, filter.externalStatus as never));
  }
  return tx
    .select()
    .from(loans)
    .where(and(...conditions));
}

export async function borrowerHasOpenLoan(borrowerId: string, tx: WilmsDb = getDb()) {
  const rows = await tx
    .select()
    .from(loans)
    .where(and(eq(loans.borrowerId, borrowerId), isNull(loans.deletedAt)));

  return rows.some(
    (row) =>
      row.externalStatus === 'PENDING_DISBURSEMENT' || row.externalStatus === 'ACTIVE',
  );
}

export async function updateLoanLifecycle(
  input: {
    loanId: string;
    expectedVersion: number;
    lifecycleStatus: string;
    loanBalance?: string;
    disbursedAmount?: string;
    approvedByUserId?: string;
    disbursedByUserId?: string;
    rejectionReason?: string;
  },
  tx: WilmsDb = getDb(),
) {
  const externalStatus = toExternalStatus(input.lifecycleStatus as never);
  const result = await tx
    .update(loans)
    .set({
      lifecycleStatus: input.lifecycleStatus as never,
      externalStatus,
      loanBalance: input.loanBalance,
      disbursedAmount: input.disbursedAmount,
      approvedByUserId: input.approvedByUserId,
      disbursedByUserId: input.disbursedByUserId,
      rejectionReason: input.rejectionReason,
      updatedAt: new Date(),
      version: input.expectedVersion + 1,
    })
    .where(and(eq(loans.id, input.loanId), eq(loans.version, input.expectedVersion)))
    .returning();

  if (result.length === 0) {
    throw new Error('CONFLICT:Loan was modified by another request.');
  }

  return result[0]!;
}

export async function listBorrowerLoans(borrowerId: string, tx: WilmsDb = getDb()) {
  return tx
    .select()
    .from(loans)
    .where(and(eq(loans.borrowerId, borrowerId), isNull(loans.deletedAt)));
}

export async function sumLedgerRepayments(loanId: string, tx: WilmsDb = getDb()) {
  const { ledgerEntries } = await import('../db/schema/ledger-entries.js');
  const rows = await tx.select().from(ledgerEntries).where(eq(ledgerEntries.loanId, loanId));
  return rows
    .filter((row) => row.entryType === 'REPAYMENT')
    .reduce((total, row) => total + Number(row.amount) * 100, 0);
}
