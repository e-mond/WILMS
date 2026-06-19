import { borrowerService } from '@/services';
import {
  CONFLICT_SEVERITY,
  REGISTRATION_CONFLICT_CODE,
  type IdCheckResult,
  type RegistrationConflict,
  type RegistrationConflictInput,
  type RegistrationConflictReport,
} from '@/types/borrower-conflicts';
import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import { logger } from '@/utils/logger';

const CONFLICT_FIELD_BY_CODE: Partial<
  Record<(typeof REGISTRATION_CONFLICT_CODE)[keyof typeof REGISTRATION_CONFLICT_CODE], keyof BorrowerRegistrationFormValues>
> = {
  [REGISTRATION_CONFLICT_CODE.DUPLICATE_PHONE]: 'phone',
  [REGISTRATION_CONFLICT_CODE.DUPLICATE_ID]: 'idNumber',
  [REGISTRATION_CONFLICT_CODE.SIMILAR_NAME]: 'fullName',
  [REGISTRATION_CONFLICT_CODE.ACTIVE_LOAN]: 'phone',
  [REGISTRATION_CONFLICT_CODE.BLACKLISTED]: 'phone',
};

export async function runRegistrationConflictChecks(
  input: RegistrationConflictInput,
): Promise<RegistrationConflictReport> {
  const [phoneResult, idResult, nameResult, activeLoanResult, blacklistResult] = await Promise.all([
    borrowerService.checkPhone(input.phone),
    input.idType && input.idNumber
      ? borrowerService.checkId(input.idType, input.idNumber)
      : Promise.resolve<IdCheckResult>({ isDuplicate: false }),
    borrowerService.checkName(input.fullName),
    borrowerService.checkActiveLoan(input.phone),
    borrowerService.checkBlacklist(input),
  ]);

  const blocking: RegistrationConflict[] = [];
  const warnings: RegistrationConflict[] = [];

  if (phoneResult.isDuplicate) {
    blocking.push({
      code: REGISTRATION_CONFLICT_CODE.DUPLICATE_PHONE,
      severity: CONFLICT_SEVERITY.BLOCK,
      field: 'phone',
      message: `Phone number is already registered to ${phoneResult.existingBorrowerName}.`,
      relatedBorrowerId: phoneResult.existingBorrowerId,
      relatedBorrowerName: phoneResult.existingBorrowerName,
    });
  }

  if (idResult.isDuplicate) {
    blocking.push({
      code: REGISTRATION_CONFLICT_CODE.DUPLICATE_ID,
      severity: CONFLICT_SEVERITY.BLOCK,
      field: 'idNumber',
      message: `This ID is already registered to ${idResult.existingBorrowerName}.`,
      relatedBorrowerId: idResult.existingBorrowerId,
      relatedBorrowerName: idResult.existingBorrowerName,
    });
  }

  if (activeLoanResult.hasActiveLoan) {
    blocking.push({
      code: REGISTRATION_CONFLICT_CODE.ACTIVE_LOAN,
      severity: CONFLICT_SEVERITY.BLOCK,
      field: 'phone',
      message: `${activeLoanResult.existingBorrowerName} already has an active loan.`,
      relatedBorrowerId: activeLoanResult.existingBorrowerId,
      relatedBorrowerName: activeLoanResult.existingBorrowerName,
    });
  }

  if (blacklistResult.isBlacklisted) {
    blocking.push({
      code: REGISTRATION_CONFLICT_CODE.BLACKLISTED,
      severity: CONFLICT_SEVERITY.BLOCK,
      field: 'phone',
      message: `${blacklistResult.existingBorrowerName} is blacklisted and cannot be registered.`,
      relatedBorrowerId: blacklistResult.existingBorrowerId,
      relatedBorrowerName: blacklistResult.existingBorrowerName,
    });
  }

  for (const match of nameResult.matches) {
    warnings.push({
      code: REGISTRATION_CONFLICT_CODE.SIMILAR_NAME,
      severity: CONFLICT_SEVERITY.WARN,
      field: 'fullName',
      message: `Name is similar to existing borrower ${match.fullName}.`,
      relatedBorrowerId: match.borrowerId,
      relatedBorrowerName: match.fullName,
    });
  }

  if (blocking.length > 0) {
    logger.warn('Registration blocked by conflict checks', {
      codes: blocking.map((conflict) => conflict.code),
      relatedBorrowerIds: blocking
        .map((conflict) => conflict.relatedBorrowerId)
        .filter((borrowerId): borrowerId is string => Boolean(borrowerId)),
    });
  }

  return { blocking, warnings };
}

export function getConflictTargetStep(conflicts: RegistrationConflict[]): number {
  const fieldSteps: Partial<Record<keyof BorrowerRegistrationFormValues, number>> = {
    fullName: 0,
    phone: 0,
    idType: 0,
    idNumber: 0,
  };

  for (const conflict of conflicts) {
    if (conflict.field && fieldSteps[conflict.field] !== undefined) {
      return fieldSteps[conflict.field]!;
    }
  }

  return 0;
}

export function getConflictField(
  code: (typeof REGISTRATION_CONFLICT_CODE)[keyof typeof REGISTRATION_CONFLICT_CODE],
): keyof BorrowerRegistrationFormValues | undefined {
  return CONFLICT_FIELD_BY_CODE[code];
}
