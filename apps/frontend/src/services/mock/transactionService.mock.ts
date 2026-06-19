import { MOCK_ADMIN_FEE_PESEWAS } from '@/mocks/system-settings';
import { getBorrowerRegistryEntries, getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { getCollectorDisplayName } from '@/services/mock/collector-display-name';
import {
  appendFinancialTransaction,
  findAdminFeeForBorrower,
  resetFinancialTransactions,
} from '@/services/mock/transaction-log.store';
import { simulateDelay } from '@/services/mock/delay';
import { BORROWER_STATUS } from '@/types/borrower';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import { TRANSACTION_TYPE, type FinancialTransaction, type RecordAdminFeeInput } from '@/types/transaction';
import type { ITransactionService } from '@/types/services';

function assertApprovedBorrower(borrowerId: string) {
  const borrower = getBorrowerRegistryEntry(borrowerId);

  if (!borrower) {
    throw new ApiError('Borrower not found.', API_ERROR_CODE.NOT_FOUND, 404);
  }

  if (borrower.status !== BORROWER_STATUS.APPROVED) {
    throw new ApiError(
      'Admin fee can only be recorded for approved borrowers.',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  return borrower;
}

const transactionServiceMock: ITransactionService = {
  async recordAdminFee(input: RecordAdminFeeInput): Promise<FinancialTransaction> {
    await simulateDelay();
    assertApprovedBorrower(input.borrowerId);

    if (findAdminFeeForBorrower(input.borrowerId)) {
      throw new ApiError(
        'Admin fee has already been recorded for this borrower.',
        API_ERROR_CODE.DUPLICATE_TRANSACTION,
        409,
      );
    }

    return appendFinancialTransaction({
      type: TRANSACTION_TYPE.ADMIN_FEE,
      borrowerId: input.borrowerId,
      amountPesewas: MOCK_ADMIN_FEE_PESEWAS,
      collectorId: input.collectorId,
      recordedAt: new Date().toISOString(),
    });
  },

  async getAdminFeeStatus(borrowerId: string) {
    await simulateDelay();
    const borrower = assertApprovedBorrower(borrowerId);
    const existingFee = findAdminFeeForBorrower(borrowerId);

    return {
      borrowerId,
      borrowerName: borrower.fullName,
      requiredAmountPesewas: MOCK_ADMIN_FEE_PESEWAS,
      isPaid: Boolean(existingFee),
      paidAt: existingFee?.recordedAt,
      recordedByCollectorId: existingFee?.collectorId,
      recordedByCollectorName: existingFee
        ? getCollectorDisplayName(existingFee.collectorId)
        : undefined,
      transactionId: existingFee?.id,
    };
  },

  async listBorrowersAwaitingAdminFee() {
    await simulateDelay();

    return getBorrowerRegistryEntries()
      .filter(
        (entry) => entry.status === BORROWER_STATUS.APPROVED && !findAdminFeeForBorrower(entry.id),
      )
      .map((entry) => ({
        id: entry.id,
        fullName: entry.fullName,
        phone: entry.phone,
        community: entry.community,
        groupName: entry.groupName,
        requiredAmountPesewas: MOCK_ADMIN_FEE_PESEWAS,
      }))
      .sort((left, right) => left.fullName.localeCompare(right.fullName));
  },
};

export function resetMockTransactions(): void {
  resetFinancialTransactions();
}

export default transactionServiceMock;
