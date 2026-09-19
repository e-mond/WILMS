export type BorrowerIdType = 'GHANA_CARD' | 'VOTER_ID' | 'PASSPORT';

export interface BorrowerIdValidationResult {
  valid: boolean;
  error?: string;
}

const GHANA_CARD_PATTERN = /^GHA-\d{9}-\d$/;
/** Ghana Electoral Commission Voter ID number: exactly 10 digits (0–9). */
const VOTER_ID_PATTERN = /^\d{10}$/;
const PASSPORT_PATTERN = /^[A-Z0-9]{6,9}$/;

export const BORROWER_ID_PLACEHOLDERS: Record<BorrowerIdType, string> = {
  GHANA_CARD: 'GHA-123456789-0',
  VOTER_ID: 'Enter 10-digit Voter ID number',
  PASSPORT: 'G1234567',
};

export const BORROWER_ID_NUMBER_LABELS: Record<BorrowerIdType, string> = {
  GHANA_CARD: 'ID number',
  VOTER_ID: 'Voter ID Number',
  PASSPORT: 'ID number',
};

export const BORROWER_ID_HELPER_TEXTS: Partial<Record<BorrowerIdType, string>> = {
  VOTER_ID: 'Enter the 10-digit Voter ID number exactly as shown on the Voter ID card.',
};

export const BORROWER_ID_ERROR_MESSAGES: Record<BorrowerIdType, string> = {
  GHANA_CARD: 'Enter a valid Ghana Card number (GHA-XXXXXXXXX-X).',
  VOTER_ID: 'Voter ID must contain exactly 10 digits.',
  PASSPORT: 'Enter a valid passport number (6–9 letters or digits).',
};

export function formatGhanaCardInput(value: string): string {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 10);

  if (digits.length <= 3) {
    return digits.length > 0 ? `GHA-${digits}` : value.startsWith('GHA') ? 'GHA-' : '';
  }

  if (digits.length <= 9) {
    return `GHA-${digits.slice(0, 9)}`;
  }

  return `GHA-${digits.slice(0, 9)}-${digits.slice(9)}`;
}

/** Live input filter: digits only, max 10 characters. Preserves leading zeroes. */
export function formatVoterIdInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Normalize Voter ID for storage and comparison.
 * Does not strip letters/punctuation — invalid input must fail validation.
 */
export function normalizeVoterId(idNumber: string): string {
  return idNumber.trim();
}

export function normalizeBorrowerId(idType: string, idNumber: string): string {
  const trimmed = idNumber.trim();

  switch (idType) {
    case 'GHANA_CARD': {
      const upper = trimmed.toUpperCase();
      if (upper.startsWith('GHA')) {
        const digits = upper.replace(/[^0-9]/g, '');
        if (digits.length === 10) {
          return `GHA-${digits.slice(0, 9)}-${digits.slice(9)}`;
        }
        return upper;
      }

      const digits = trimmed.replace(/[^0-9]/g, '');
      if (digits.length === 10) {
        return `GHA-${digits.slice(0, 9)}-${digits.slice(9)}`;
      }

      return upper;
    }
    case 'VOTER_ID':
      return normalizeVoterId(trimmed);
    case 'PASSPORT':
      return trimmed.toUpperCase().replace(/\s+/g, '');
    default:
      return trimmed;
  }
}

export function validateBorrowerId(
  idType: string,
  idNumber: string,
): BorrowerIdValidationResult {
  const normalized = normalizeBorrowerId(idType, idNumber);

  if (!normalized) {
    return { valid: false, error: 'ID number is required.' };
  }

  switch (idType) {
    case 'GHANA_CARD':
      return GHANA_CARD_PATTERN.test(normalized)
        ? { valid: true }
        : { valid: false, error: BORROWER_ID_ERROR_MESSAGES.GHANA_CARD };
    case 'VOTER_ID':
      return VOTER_ID_PATTERN.test(normalized)
        ? { valid: true }
        : { valid: false, error: BORROWER_ID_ERROR_MESSAGES.VOTER_ID };
    case 'PASSPORT':
      return PASSPORT_PATTERN.test(normalized)
        ? { valid: true }
        : { valid: false, error: BORROWER_ID_ERROR_MESSAGES.PASSPORT };
    default:
      return { valid: false, error: 'Select a valid ID type.' };
  }
}
