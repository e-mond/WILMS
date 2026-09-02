import { LOAN_STATUS } from '@/types/loan';
import { countMissedWeeks } from '@/utils/schedule-missed-marking';
import type {
  CollectorDashboardLoanInput,
  CollectorDashboardPaymentInput,
} from '@/features/payment-collection/collector-dashboard.utils';
import { resolveBorrowerGroupId } from '@/services/mock/borrower-full-profile.builder';
import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { getStoredLoanSchedule } from '@/services/mock/loan-schedule.store';
import loanServiceMock from '@/services/mock/loanService.mock';
import { buildCollectorPaymentInputs } from '@/utils/collector-payment-inputs';

export async function loadCollectorBookInputs(referenceDate: string): Promise<{
  loans: CollectorDashboardLoanInput[];
  payments: CollectorDashboardPaymentInput[];
}> {
  const portfolio = await loanServiceMock.listPortfolioEntries();
  const bookLoans = portfolio.filter(
    (loan) => loan.status === LOAN_STATUS.ACTIVE || loan.status === LOAN_STATUS.COMPLETED,
  );

  const preferredLoanByBorrower = new Map<string, (typeof bookLoans)[number]>();
  for (const loan of bookLoans) {
    const existing = preferredLoanByBorrower.get(loan.borrowerId);
    if (!existing || (loan.status === LOAN_STATUS.ACTIVE && existing.status !== LOAN_STATUS.ACTIVE)) {
      preferredLoanByBorrower.set(loan.borrowerId, loan);
    }
  }

  const loans = [...preferredLoanByBorrower.values()].map((loan) => {
    const borrower = getBorrowerRegistryEntry(loan.borrowerId);
    const groupName = loan.groupName;
    const isCompleted = loan.status === LOAN_STATUS.COMPLETED;

    return {
      id: loan.id,
      borrowerId: loan.borrowerId,
      borrowerName: borrower?.fullName ?? loan.borrowerName,
      phone: borrower?.phone ?? '—',
      community: borrower?.community ?? loan.community,
      groupId: borrower ? resolveBorrowerGroupId(borrower, groupName) : '',
      groupName,
      weeklyPaymentPesewas: isCompleted ? 0 : loan.weeklyPaymentPesewas,
      paymentDay: loan.paymentDay,
      missedWeeks: isCompleted
        ? 0
        : countMissedWeeks(getStoredLoanSchedule(loan.id, referenceDate) ?? []),
    };
  });

  return {
    loans,
    payments: buildCollectorPaymentInputs(referenceDate),
  };
}

export async function loadCollectorDashboardInputs(referenceDate: string): Promise<{
  loans: CollectorDashboardLoanInput[];
  payments: CollectorDashboardPaymentInput[];
}> {
  const portfolio = await loanServiceMock.listPortfolioEntries();
  const activeLoans = portfolio.filter((loan) => loan.status === LOAN_STATUS.ACTIVE);

  const loans = activeLoans.map((loan) => {
    const borrower = getBorrowerRegistryEntry(loan.borrowerId);
    const groupName = loan.groupName;

    return {
      id: loan.id,
      borrowerId: loan.borrowerId,
      borrowerName: borrower?.fullName ?? loan.borrowerName,
      phone: borrower?.phone ?? '—',
      community: borrower?.community ?? loan.community,
      groupId: borrower ? resolveBorrowerGroupId(borrower, groupName) : '',
      groupName,
      weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
      paymentDay: loan.paymentDay,
      missedWeeks: countMissedWeeks(getStoredLoanSchedule(loan.id, referenceDate) ?? []),
    };
  });

  return {
    loans,
    payments: buildCollectorPaymentInputs(referenceDate),
  };
}
