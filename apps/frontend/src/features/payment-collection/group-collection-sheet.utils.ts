import type { CollectorDashboardBorrower } from '@/types/collector-dashboard';
import { COLLECTOR_PAYMENT_STATUS } from '@/types/collector-dashboard';
import type { GpsCoordinates } from '@/types/payment';

export type SheetPaymentMode = 'NORMAL' | 'DOUBLE' | 'PARTIAL' | 'ADVANCE';
export type MemberPaymentChoice = 'PAID' | 'MISSED' | 'UNSET';
export type SheetRowRecordedState = 'NONE' | 'COLLECTED' | 'MISSED';

export interface SheetMember {
  borrowerId: string;
  borrowerName: string;
  loanId: string;
  expectedPesewas: number;
  choice: MemberPaymentChoice;
  recorded: SheetRowRecordedState;
  rowError?: string;
}

export function resolveSheetAmountPesewas(
  expectedPesewas: number,
  mode: SheetPaymentMode,
): number {
  if (expectedPesewas <= 0) {
    return 0;
  }

  switch (mode) {
    case 'DOUBLE':
      return expectedPesewas * 2;
    case 'PARTIAL':
      return Math.max(1, Math.floor(expectedPesewas / 2));
    case 'ADVANCE':
    case 'NORMAL':
    default:
      return expectedPesewas;
  }
}

export function buildInitialSheetMembers(
  borrowers: CollectorDashboardBorrower[],
  groupId: string,
): SheetMember[] {
  return borrowers
    .filter((borrower) => borrower.groupId === groupId && borrower.expectedPesewas > 0)
    .map((borrower) => {
      const recorded: SheetRowRecordedState =
        borrower.paymentStatus === COLLECTOR_PAYMENT_STATUS.COLLECTED
          ? 'COLLECTED'
          : borrower.paymentStatus === COLLECTOR_PAYMENT_STATUS.MISSED
            ? 'MISSED'
            : 'NONE';

      return {
        borrowerId: borrower.borrowerId,
        borrowerName: borrower.borrowerName,
        loanId: borrower.loanId,
        expectedPesewas: borrower.expectedPesewas,
        choice: 'UNSET' as MemberPaymentChoice,
        recorded,
      };
    });
}

export function isSheetRowLocked(member: SheetMember): boolean {
  return member.recorded === 'COLLECTED' || member.recorded === 'MISSED';
}

export function applySelectAllChoice(
  members: SheetMember[],
  choice: 'PAID' | 'MISSED',
): SheetMember[] {
  return members.map((member) => {
    if (isSheetRowLocked(member) || member.choice !== 'UNSET') {
      return member;
    }
    return { ...member, choice, rowError: undefined };
  });
}

export function setMemberChoice(
  members: SheetMember[],
  borrowerId: string,
  choice: MemberPaymentChoice,
): SheetMember[] {
  return members.map((member) => {
    if (member.borrowerId !== borrowerId || isSheetRowLocked(member)) {
      return member;
    }
    return { ...member, choice, rowError: undefined };
  });
}

export interface SheetBatchDeps {
  collectorId: string;
  paymentDate: string;
  paymentMode: SheetPaymentMode;
  gps: GpsCoordinates;
  recordPayment: (input: {
    borrowerId: string;
    amountPesewas: number;
    paymentDate: string;
    collectorId: string;
    gps: GpsCoordinates;
  }) => Promise<unknown>;
  markMissedPayment: (input: {
    borrowerId: string;
    paymentDate: string;
    collectorId: string;
    loanId?: string;
  }) => Promise<unknown>;
}

export interface SheetBatchResult {
  members: SheetMember[];
  paidCount: number;
  missedCount: number;
  errorCount: number;
}

/**
 * Commits PAID / MISSED choices via APIs. Continues on per-row failures.
 */
export async function submitGroupCollectionBatch(
  members: SheetMember[],
  deps: SheetBatchDeps,
): Promise<SheetBatchResult> {
  const next = members.map((member) => ({ ...member }));
  let paidCount = 0;
  let missedCount = 0;
  let errorCount = 0;

  for (let index = 0; index < next.length; index += 1) {
    const member = next[index]!;
    if (isSheetRowLocked(member) || member.choice === 'UNSET') {
      continue;
    }

    try {
      if (member.choice === 'PAID') {
        const amountPesewas = resolveSheetAmountPesewas(member.expectedPesewas, deps.paymentMode);
        if (amountPesewas <= 0) {
          throw new Error('Expected amount is required to record payment.');
        }
        await deps.recordPayment({
          borrowerId: member.borrowerId,
          amountPesewas,
          paymentDate: deps.paymentDate,
          collectorId: deps.collectorId,
          gps: deps.gps,
        });
        next[index] = {
          ...member,
          recorded: 'COLLECTED',
          choice: 'UNSET',
          rowError: undefined,
        };
        paidCount += 1;
      } else if (member.choice === 'MISSED') {
        await deps.markMissedPayment({
          borrowerId: member.borrowerId,
          paymentDate: deps.paymentDate,
          collectorId: deps.collectorId,
          loanId: member.loanId || undefined,
        });
        next[index] = {
          ...member,
          recorded: 'MISSED',
          choice: 'UNSET',
          rowError: undefined,
        };
        missedCount += 1;
      }
    } catch (error) {
      errorCount += 1;
      next[index] = {
        ...member,
        rowError: error instanceof Error ? error.message : 'Unable to record this row.',
      };
    }
  }

  return { members: next, paidCount, missedCount, errorCount };
}
