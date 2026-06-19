import { LOAN_STATUS } from '@/types/loan';
import { countMissedWeeks } from '@/utils/schedule-missed-marking';
import type {
  CollectorDashboardLoanInput,
  CollectorDashboardPaymentInput,
} from '@/features/payment-collection/collector-dashboard.utils';
import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { getStoredLoanSchedule } from '@/services/mock/loan-schedule.store';
import loanServiceMock from '@/services/mock/loanService.mock';
import { buildCollectorPaymentInputs } from '@/utils/collector-payment-inputs';

export async function loadCollectorDashboardInputs(referenceDate: string): Promise<{
  loans: CollectorDashboardLoanInput[];
  payments: CollectorDashboardPaymentInput[];
}> {
  const portfolio = await loanServiceMock.listPortfolioEntries();
  const activeLoans = portfolio.filter((loan) => loan.status === LOAN_STATUS.ACTIVE);

  const loans = activeLoans.map((loan) => {
    const borrower = getBorrowerRegistryEntry(loan.borrowerId);

    return {
      id: loan.id,
      borrowerId: loan.borrowerId,
      borrowerName: borrower?.fullName ?? loan.borrowerName,
      phone: borrower?.phone ?? '—',
      community: borrower?.community ?? loan.community,
      groupName: loan.groupName,
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
