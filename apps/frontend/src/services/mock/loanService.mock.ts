import {
  LOAN_STATUS,
  type BorrowerLoanHistoryEntry,
  type LoanDetail,
  type LoanPaymentLogEntry,
  type LoanPortfolioEntry,
  type LoanProgressSummary,
  type LoanSummary,
} from '@/types/loan';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import type { CreateLoanInput } from '@/types/loan';
import type { ILoanService } from '@/types/services';
import { BORROWER_STATUS } from '@/types/borrower';
import { formatDisbursementDisplayId, formatPaymentDisplayId } from '@wilms/shared-utils';
import {
  getBorrowerRegistryEntries,
  getBorrowerRegistryEntry,
} from '@/services/mock/borrower-registry.store';
import {
  findAdminFeeForBorrower,
  getFinancialTransactions,
  getTransactionsForLoan,
} from '@/services/mock/transaction-log.store';
import { calculateLoanProgress } from '@/features/loan-management/loan-progress.utils';
import { TRANSACTION_TYPE } from '@/types/transaction';
import {
  getStoredLoanSchedule,
  resetLoanSchedules,
  saveLoanSchedule,
} from '@/services/mock/loan-schedule.store';
import { calculateWeeklyPaymentPesewas } from '@/utils/loan-calculations';
import { generateLoanSchedule } from '@/utils/loan-schedule';
import { notifyLoanDisbursed } from '@/services/mock/loan-notifications.sync';
import { applyMockPoolDisbursement } from '@/services/mock/loanPoolService.mock';
import { simulateDelay } from '@/services/mock/delay';

const mockLoanPoolLinks = new Map<string, string>();

let mockLoans: LoanDetail[] = [
  {
    id: 'loan-001',
    borrowerId: 'borrower-001',
    amountPesewas: 50000,
    durationWeeks: 10,
    weeklyPaymentPesewas: 5000,
    status: LOAN_STATUS.ACTIVE,
    paymentDay: 'Friday',
    startDate: '2026-05-01',
    cycleBatch: 'Cycle 1 — January 2026',
    outstandingPesewas: 35000,
  },
  {
    id: 'loan-pending-001',
    borrowerId: 'borrower-002',
    amountPesewas: 30000,
    durationWeeks: 12,
    weeklyPaymentPesewas: 2500,
    status: LOAN_STATUS.PENDING_DISBURSEMENT,
    paymentDay: 'Monday',
    startDate: '2026-06-10',
    cycleBatch: 'Cycle 2 — April 2026',
    outstandingPesewas: 30000,
  },
  {
    id: 'loan-completed-001',
    borrowerId: 'borrower-003',
    amountPesewas: 24000,
    durationWeeks: 8,
    weeklyPaymentPesewas: 3000,
    status: LOAN_STATUS.COMPLETED,
    paymentDay: 'Thursday',
    startDate: '2025-11-01',
    cycleBatch: 'Cycle 4 — October 2025',
    outstandingPesewas: 0,
  },
  {
    id: 'loan-002',
    borrowerId: 'borrower-004',
    amountPesewas: 48000,
    durationWeeks: 12,
    weeklyPaymentPesewas: 4000,
    status: LOAN_STATUS.ACTIVE,
    paymentDay: 'Tuesday',
    startDate: '2026-04-01',
    cycleBatch: 'Cycle 2 — April 2026',
    outstandingPesewas: 32000,
  },
  {
    id: 'loan-003',
    borrowerId: 'borrower-005',
    amountPesewas: 35000,
    durationWeeks: 10,
    weeklyPaymentPesewas: 3500,
    status: LOAN_STATUS.ACTIVE,
    paymentDay: 'Wednesday',
    startDate: '2026-04-15',
    cycleBatch: 'Cycle 2 — April 2026',
    outstandingPesewas: 28000,
  },
  {
    id: 'loan-004',
    borrowerId: 'borrower-006',
    amountPesewas: 96000,
    durationWeeks: 16,
    weeklyPaymentPesewas: 6000,
    status: LOAN_STATUS.ACTIVE,
    paymentDay: 'Friday',
    startDate: '2026-03-01',
    cycleBatch: 'Cycle 1 — January 2026',
    outstandingPesewas: 60000,
  },
];

let nextLoanId = mockLoans.length + 1;

function toPortfolioEntry(loan: LoanDetail): LoanPortfolioEntry {
  const borrower = getBorrowerRegistryEntry(loan.borrowerId);

  return {
    id: loan.id,
    borrowerId: loan.borrowerId,
    borrowerName: borrower?.fullName ?? 'Unknown borrower',
    community: borrower?.community ?? '—',
    groupName: borrower?.groupName ?? '—',
    amountPesewas: loan.amountPesewas,
    outstandingPesewas: loan.outstandingPesewas,
    weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    durationWeeks: loan.durationWeeks,
    status: loan.status,
    cycleBatch: loan.cycleBatch,
    paymentDay: loan.paymentDay,
    startDate: loan.startDate,
  };
}

function borrowerHasOpenLoan(borrowerId: string): boolean {
  return mockLoans.some(
    (loan) =>
      loan.borrowerId === borrowerId &&
      (loan.status === LOAN_STATUS.ACTIVE || loan.status === LOAN_STATUS.PENDING_DISBURSEMENT),
  );
}

function buildDisbursementEligibility(borrowerId: string) {
  const borrower = getBorrowerRegistryEntry(borrowerId);

  if (!borrower) {
    return {
      borrowerId,
      canDisburse: false,
      reason: 'Borrower not found.',
    };
  }

  if (!findAdminFeeForBorrower(borrowerId)) {
    return {
      borrowerId,
      canDisburse: false,
      reason: 'Admin fee must be recorded before loan disbursement.',
    };
  }

  return {
    borrowerId,
    canDisburse: true,
  };
}

function assertLoanCreationAllowed(input: CreateLoanInput): void {
  const borrower = getBorrowerRegistryEntry(input.borrowerId);

  if (!borrower) {
    throw new ApiError('Borrower not found.', API_ERROR_CODE.NOT_FOUND, 404);
  }

  if (borrower.status !== BORROWER_STATUS.APPROVED) {
    throw new ApiError(
      'Loans can only be created for approved borrowers.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  if (!findAdminFeeForBorrower(input.borrowerId)) {
    throw new ApiError(
      'Admin fee must be recorded before creating a loan.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  if (borrowerHasOpenLoan(input.borrowerId)) {
    throw new ApiError(
      'This borrower already has an active or pending loan.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  if (input.amountPesewas % input.durationWeeks !== 0) {
    throw new ApiError(
      'Loan amount must divide evenly across all weeks.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }
}

const loanServiceMock: ILoanService = {
  async listLoans(): Promise<LoanSummary[]> {
    await simulateDelay();
    return [...mockLoans];
  },

  async listPortfolioEntries(): Promise<LoanPortfolioEntry[]> {
    await simulateDelay();
    return mockLoans
      .map(toPortfolioEntry)
      .sort((left, right) => left.borrowerName.localeCompare(right.borrowerName));
  },

  async listActiveLoans(): Promise<LoanSummary[]> {
    await simulateDelay();
    return mockLoans.filter((loan) => loan.status === LOAN_STATUS.ACTIVE);
  },

  async listEligibleBorrowers() {
    await simulateDelay();
    return getBorrowerRegistryEntries()
      .filter(
        (entry) =>
          entry.status === BORROWER_STATUS.APPROVED &&
          Boolean(findAdminFeeForBorrower(entry.id)) &&
          !borrowerHasOpenLoan(entry.id),
      )
      .map((entry) => ({
        id: entry.id,
        fullName: entry.fullName,
        phone: entry.phone,
        community: entry.community,
        groupName: entry.groupName,
      }))
      .sort((left, right) => left.fullName.localeCompare(right.fullName));
  },

  async getLoan(id: string): Promise<LoanDetail> {
    await simulateDelay();
    const loan = mockLoans.find((entry) => entry.id === id);

    if (!loan) {
      throw new ApiError('Loan not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    return loan;
  },

  async listBorrowerLoans(borrowerId: string): Promise<BorrowerLoanHistoryEntry[]> {
    await simulateDelay();

    return mockLoans
      .filter((loan) => loan.borrowerId === borrowerId)
      .map((loan) => ({
        id: loan.id,
        amountPesewas: loan.amountPesewas,
        outstandingPesewas: loan.outstandingPesewas,
        weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
        durationWeeks: loan.durationWeeks,
        status: loan.status,
        cycleBatch: loan.cycleBatch,
        startDate: loan.startDate,
      }))
      .sort((left, right) => right.startDate.localeCompare(left.startDate));
  },

  async getLoanProgress(loanId: string): Promise<LoanProgressSummary> {
    await simulateDelay();
    const loan = mockLoans.find((entry) => entry.id === loanId);

    if (!loan) {
      throw new ApiError('Loan not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    const weeks = getStoredLoanSchedule(loanId, new Date().toISOString().slice(0, 10));

    if (!weeks?.length) {
      throw new ApiError('Loan schedule not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    return calculateLoanProgress({
      loanId,
      amountPesewas: loan.amountPesewas,
      scheduleWeeks: weeks,
      transactions: getFinancialTransactions(),
    });
  },

  async listLoanPaymentLog(loanId: string): Promise<LoanPaymentLogEntry[]> {
    await simulateDelay();
    const loan = mockLoans.find((entry) => entry.id === loanId);

    if (!loan) {
      throw new ApiError('Loan not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    return getTransactionsForLoan(loanId)
      .filter(
        (transaction) =>
          transaction.type === TRANSACTION_TYPE.REPAYMENT ||
          transaction.type === TRANSACTION_TYPE.DISBURSEMENT,
      )
      .map((transaction, index) => ({
        id: transaction.id,
        displayId:
          transaction.type === TRANSACTION_TYPE.DISBURSEMENT
            ? formatDisbursementDisplayId({
                disbursedAt: transaction.recordedAt,
                sequence: index + 1,
              })
            : formatPaymentDisplayId({ recordedAt: transaction.recordedAt, sequence: index + 1 }),
        type: transaction.type as 'DISBURSEMENT' | 'REPAYMENT',
        amountPesewas: transaction.amountPesewas,
        recordedAt: transaction.recordedAt,
        collectorId: transaction.collectorId,
        weekNumber: transaction.type === TRANSACTION_TYPE.REPAYMENT ? index + 1 : undefined,
        receiptNumber:
          transaction.type === TRANSACTION_TYPE.REPAYMENT ? `RCP-${transaction.id.slice(-6)}` : undefined,
        gpsVerified: true,
        paymentStatus: 'CONFIRMED' as const,
      }))
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  },

  async getLoanSchedule(loanId: string) {
    await simulateDelay();
    const loan = mockLoans.find((entry) => entry.id === loanId);

    if (!loan) {
      throw new ApiError('Loan not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    const weeks = getStoredLoanSchedule(loanId, new Date().toISOString().slice(0, 10));

    if (!weeks?.length) {
      throw new ApiError('Loan schedule not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    return {
      loanId,
      weeks,
    };
  },

  async createLoan(input: CreateLoanInput): Promise<LoanDetail> {
    await simulateDelay();
    assertLoanCreationAllowed(input);

    const weeklyPaymentPesewas = calculateWeeklyPaymentPesewas(
      input.amountPesewas,
      input.durationWeeks,
    );

    const loan: LoanDetail = {
      id: `loan-${String(nextLoanId).padStart(3, '0')}`,
      borrowerId: input.borrowerId,
      amountPesewas: input.amountPesewas,
      durationWeeks: input.durationWeeks,
      weeklyPaymentPesewas,
      status: LOAN_STATUS.PENDING_DISBURSEMENT,
      paymentDay: input.paymentDay,
      startDate: input.startDate,
      cycleBatch: input.cycleBatch,
      outstandingPesewas: input.amountPesewas,
    };

    const schedule = generateLoanSchedule({
      durationWeeks: input.durationWeeks,
      weeklyPaymentPesewas,
      startDate: input.startDate,
      paymentDay: input.paymentDay,
    });

    nextLoanId += 1;
    mockLoans = [...mockLoans, loan];
    if (input.loanPoolId) {
      mockLoanPoolLinks.set(loan.id, input.loanPoolId);
    }
    saveLoanSchedule(loan.id, schedule);
    return loan;
  },

  async getDisbursementEligibility(borrowerId: string) {
    await simulateDelay();
    return buildDisbursementEligibility(borrowerId);
  },

  async approveLoan(loanId: string): Promise<LoanDetail> {
    await simulateDelay();
    const loanIndex = mockLoans.findIndex((entry) => entry.id === loanId);
    if (loanIndex === -1) {
      throw new ApiError('Loan not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }
    const loan = { ...mockLoans[loanIndex], status: LOAN_STATUS.PENDING_DISBURSEMENT };
    mockLoans = [...mockLoans.slice(0, loanIndex), loan, ...mockLoans.slice(loanIndex + 1)];
    return loan;
  },

  async rejectLoan(loanId: string, input: { reason: string }): Promise<LoanDetail> {
    await simulateDelay();
    void input.reason;
    const loanIndex = mockLoans.findIndex((entry) => entry.id === loanId);
    if (loanIndex === -1) {
      throw new ApiError('Loan not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }
    const loan = { ...mockLoans[loanIndex], status: LOAN_STATUS.WRITTEN_OFF };
    mockLoans = [...mockLoans.slice(0, loanIndex), loan, ...mockLoans.slice(loanIndex + 1)];
    return loan;
  },

  async disburseLoan(loanId: string): Promise<LoanDetail> {
    await simulateDelay();
    const loanIndex = mockLoans.findIndex((entry) => entry.id === loanId);

    if (loanIndex === -1) {
      throw new ApiError('Loan not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    const loan = mockLoans[loanIndex];

    if (loan.status !== LOAN_STATUS.PENDING_DISBURSEMENT) {
      throw new ApiError(
        'Only loans pending disbursement can be disbursed.',
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    const eligibility = buildDisbursementEligibility(loan.borrowerId);

    if (!eligibility.canDisburse) {
      throw new ApiError(
        eligibility.reason ?? 'Loan disbursement is not permitted.',
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    const disbursedLoan: LoanDetail = {
      ...loan,
      status: LOAN_STATUS.ACTIVE,
    };

    mockLoans = mockLoans.map((entry) => (entry.id === loanId ? disbursedLoan : entry));
    const linkedPoolId = mockLoanPoolLinks.get(loanId);
    if (linkedPoolId) {
      applyMockPoolDisbursement(linkedPoolId, loan.amountPesewas);
    }
    await notifyLoanDisbursed(disbursedLoan);
    return disbursedLoan;
  },
};

export function getActiveLoanForBorrower(borrowerId: string): LoanDetail | undefined {
  return mockLoans.find(
    (loan) => loan.borrowerId === borrowerId && loan.status === LOAN_STATUS.ACTIVE,
  );
}

export function applyLoanRepayment(loanId: string, paymentPesewas: number): void {
  mockLoans = mockLoans.map((loan) => {
    if (loan.id !== loanId) {
      return loan;
    }

    const outstandingPesewas = Math.max(loan.outstandingPesewas - paymentPesewas, 0);

    return {
      ...loan,
      outstandingPesewas,
      status: outstandingPesewas === 0 ? LOAN_STATUS.COMPLETED : loan.status,
    };
  });
}

export function getAllMockLoans(): LoanDetail[] {
  return mockLoans;
}

export function updateLoanStatusInMock(loanId: string, status: LoanDetail['status']): LoanDetail {
  const existing = mockLoans.find((loan) => loan.id === loanId);

  if (!existing) {
    throw new Error('Loan not found.');
  }

  const updated: LoanDetail = {
    ...existing,
    status,
    outstandingPesewas:
      status === LOAN_STATUS.COMPLETED || status === LOAN_STATUS.WRITTEN_OFF
        ? 0
        : existing.outstandingPesewas,
  };

  mockLoans = mockLoans.map((loan) => (loan.id === loanId ? updated : loan));
  return updated;
}

export function resetMockLoans(): void {
  mockLoanPoolLinks.clear();
  resetLoanSchedules();
  mockLoans = [
    {
      id: 'loan-001',
      borrowerId: 'borrower-001',
      amountPesewas: 50000,
      durationWeeks: 10,
      weeklyPaymentPesewas: 5000,
      status: LOAN_STATUS.ACTIVE,
      paymentDay: 'Friday',
      startDate: '2026-05-01',
      cycleBatch: 'Cycle 1 — January 2026',
      outstandingPesewas: 35000,
    },
    {
      id: 'loan-pending-001',
      borrowerId: 'borrower-002',
      amountPesewas: 30000,
      durationWeeks: 12,
      weeklyPaymentPesewas: 2500,
      status: LOAN_STATUS.PENDING_DISBURSEMENT,
      paymentDay: 'Monday',
      startDate: '2026-06-10',
      cycleBatch: 'Cycle 2 — April 2026',
      outstandingPesewas: 30000,
    },
    {
      id: 'loan-completed-001',
      borrowerId: 'borrower-003',
      amountPesewas: 24000,
      durationWeeks: 8,
      weeklyPaymentPesewas: 3000,
      status: LOAN_STATUS.COMPLETED,
      paymentDay: 'Thursday',
      startDate: '2025-11-01',
      cycleBatch: 'Cycle 4 — October 2025',
      outstandingPesewas: 0,
    },
    {
      id: 'loan-002',
      borrowerId: 'borrower-004',
      amountPesewas: 48000,
      durationWeeks: 12,
      weeklyPaymentPesewas: 4000,
      status: LOAN_STATUS.ACTIVE,
      paymentDay: 'Tuesday',
      startDate: '2026-04-01',
      cycleBatch: 'Cycle 2 — April 2026',
      outstandingPesewas: 32000,
    },
    {
      id: 'loan-003',
      borrowerId: 'borrower-005',
      amountPesewas: 35000,
      durationWeeks: 10,
      weeklyPaymentPesewas: 3500,
      status: LOAN_STATUS.ACTIVE,
      paymentDay: 'Wednesday',
      startDate: '2026-04-15',
      cycleBatch: 'Cycle 2 — April 2026',
      outstandingPesewas: 28000,
    },
    {
      id: 'loan-004',
      borrowerId: 'borrower-006',
      amountPesewas: 96000,
      durationWeeks: 16,
      weeklyPaymentPesewas: 6000,
      status: LOAN_STATUS.ACTIVE,
      paymentDay: 'Friday',
      startDate: '2026-03-01',
      cycleBatch: 'Cycle 1 — January 2026',
      outstandingPesewas: 60000,
    },
  ];
  nextLoanId = mockLoans.length + 1;
}

export default loanServiceMock;
