import type { BorrowerIdType } from '@/constants/borrower-registration';
import { BORROWER_STATUS } from '@/types/borrower';
import type {
  ActiveLoanCheckResult,
  BlacklistCheckResult,
  IdCheckResult,
  PhoneCheckResult,
  RegistrationConflictInput,
  SimilarNameCheckResult,
} from '@/types/borrower-conflicts';
import { levenshteinDistance } from '@/utils/levenshtein';
import { normalizeGhanaPhone } from '@/utils/normalize-phone';
import type { BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import { getBorrowerRegistryEntries } from '@/services/mock/borrower-registry.store';

export const FUZZY_NAME_MAX_DISTANCE = 2;

export function normalizeBorrowerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeIdNumber(idNumber: string): string {
  return idNumber.trim().toUpperCase();
}

function findEntryByPhone(phone: string, entries: BorrowerRegistryEntry[]): BorrowerRegistryEntry | undefined {
  const normalizedPhone = normalizeGhanaPhone(phone);

  return entries.find((entry) => normalizeGhanaPhone(entry.phone) === normalizedPhone);
}

function findEntryById(
  idType: BorrowerIdType,
  idNumber: string,
  entries: BorrowerRegistryEntry[],
): BorrowerRegistryEntry | undefined {
  const normalizedIdNumber = normalizeIdNumber(idNumber);

  return entries.find(
    (entry) => entry.idType === idType && normalizeIdNumber(entry.idNumber) === normalizedIdNumber,
  );
}

export function checkPhoneDuplicate(phone: string): PhoneCheckResult {
  const existing = findEntryByPhone(phone, getBorrowerRegistryEntries());

  if (!existing) {
    return { isDuplicate: false };
  }

  return {
    isDuplicate: true,
    existingBorrowerId: existing.id,
    existingBorrowerName: existing.fullName,
  };
}

export function checkIdDuplicate(idType: BorrowerIdType, idNumber: string): IdCheckResult {
  const existing = findEntryById(idType, idNumber, getBorrowerRegistryEntries());

  if (!existing) {
    return { isDuplicate: false };
  }

  return {
    isDuplicate: true,
    existingBorrowerId: existing.id,
    existingBorrowerName: existing.fullName,
  };
}

export function checkSimilarNames(fullName: string): SimilarNameCheckResult {
  const normalizedInput = normalizeBorrowerName(fullName);
  const matches = getBorrowerRegistryEntries()
    .map((entry) => {
      const normalizedEntryName = normalizeBorrowerName(entry.fullName);
      const distance = levenshteinDistance(normalizedInput, normalizedEntryName);

      return {
        borrowerId: entry.id,
        fullName: entry.fullName,
        distance,
      };
    })
    .filter(
      (match) =>
        match.distance > 0 &&
        match.distance <= FUZZY_NAME_MAX_DISTANCE,
    )
    .sort((left, right) => left.distance - right.distance);

  return { matches };
}

export function checkActiveLoan(phone: string): ActiveLoanCheckResult {
  const existing = findEntryByPhone(phone, getBorrowerRegistryEntries());

  if (!existing?.hasActiveLoan) {
    return { hasActiveLoan: false };
  }

  return {
    hasActiveLoan: true,
    existingBorrowerId: existing.id,
    existingBorrowerName: existing.fullName,
  };
}

export function checkBlacklist(input: RegistrationConflictInput): BlacklistCheckResult {
  const entries = getBorrowerRegistryEntries();
  const phoneMatch = input.phone ? findEntryByPhone(input.phone, entries) : undefined;
  const idMatch =
    input.idType && input.idNumber
      ? findEntryById(input.idType, input.idNumber, entries)
      : undefined;

  const blacklistedEntry = [phoneMatch, idMatch].find(
    (entry) => entry?.status === BORROWER_STATUS.BLACKLISTED,
  );

  if (!blacklistedEntry) {
    return { isBlacklisted: false };
  }

  return {
    isBlacklisted: true,
    existingBorrowerId: blacklistedEntry.id,
    existingBorrowerName: blacklistedEntry.fullName,
  };
}
