import { describe, expect, it } from 'vitest';
import {
  BORROWER_ID_ERROR_MESSAGES,
  BORROWER_ID_HELPER_TEXTS,
  BORROWER_ID_NUMBER_LABELS,
  BORROWER_ID_PLACEHOLDERS,
  formatGhanaCardInput,
  formatVoterIdInput,
  normalizeBorrowerId,
  normalizeVoterId,
  validateBorrowerId,
} from '@wilms/shared-validation';

describe('borrower ID validation', () => {
  it('accepts a normalized Ghana Card', () => {
    const result = validateBorrowerId('GHANA_CARD', 'GHA-123456789-0');
    expect(result.valid).toBe(true);
    expect(normalizeBorrowerId('GHANA_CARD', 'gha1234567890')).toBe('GHA-123456789-0');
  });

  it('rejects an invalid Ghana Card format', () => {
    const result = validateBorrowerId('GHANA_CARD', 'GHA-12345');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Ghana Card');
  });

  it('accepts exactly 10 digits', () => {
    expect(validateBorrowerId('VOTER_ID', '0123456789').valid).toBe(true);
    expect(normalizeBorrowerId('VOTER_ID', '0123456789')).toBe('0123456789');
  });

  it('accepts 10 digits beginning with 0 and preserves the leading zero', () => {
    expect(validateBorrowerId('VOTER_ID', '0123456789').valid).toBe(true);
    expect(normalizeVoterId('0123456789')).toBe('0123456789');
    expect(normalizeBorrowerId('VOTER_ID', '0123456789')).toBe('0123456789');
  });

  it('rejects fewer than 10 digits', () => {
    expect(validateBorrowerId('VOTER_ID', '123456789').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '123456789').error).toBe(
      BORROWER_ID_ERROR_MESSAGES.VOTER_ID,
    );
  });

  it('rejects more than 10 digits', () => {
    expect(validateBorrowerId('VOTER_ID', '01234567890').valid).toBe(false);
  });

  it('rejects any letter', () => {
    expect(validateBorrowerId('VOTER_ID', 'A123456789').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', 'ABCDEFGHIJ').valid).toBe(false);
  });

  it('rejects spaces', () => {
    expect(validateBorrowerId('VOTER_ID', '01234 56789').valid).toBe(false);
  });

  it('rejects hyphens', () => {
    expect(validateBorrowerId('VOTER_ID', '01234-56789').valid).toBe(false);
  });

  it('rejects other punctuation', () => {
    expect(validateBorrowerId('VOTER_ID', '01234.5678').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '012345678!').valid).toBe(false);
  });

  it('rejects empty and whitespace-only values', () => {
    expect(validateBorrowerId('VOTER_ID', '').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '   ').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '').error).toBe('ID number is required.');
  });

  it('filters live voter ID input to digits only with a max of 10', () => {
    expect(formatVoterIdInput('A01-234 56789xyz')).toBe('0123456789');
    expect(formatVoterIdInput('01234567890123')).toBe('0123456789');
  });

  it('does not apply voter ID rules to Ghana Card or Passport', () => {
    expect(validateBorrowerId('GHANA_CARD', 'A123456789').valid).toBe(false);
    expect(validateBorrowerId('PASSPORT', 'A01010').valid).toBe(true);
    expect(validateBorrowerId('PASSPORT', 'A0101').valid).toBe(false);
  });

  it('accepts passport numbers', () => {
    expect(validateBorrowerId('PASSPORT', 'G1234567').valid).toBe(true);
  });

  it('rejects short passport numbers', () => {
    expect(validateBorrowerId('PASSPORT', 'AB12').valid).toBe(false);
  });

  it('formats Ghana Card input with hyphens', () => {
    expect(formatGhanaCardInput('1234567890')).toBe('GHA-123456789-0');
  });

  it('exposes voter ID labels, placeholders, and helper text', () => {
    expect(BORROWER_ID_PLACEHOLDERS.GHANA_CARD).toBe('GHA-123456789-0');
    expect(BORROWER_ID_PLACEHOLDERS.VOTER_ID).toBe('Enter 10-digit Voter ID number');
    expect(BORROWER_ID_NUMBER_LABELS.VOTER_ID).toBe('Voter ID Number');
    expect(BORROWER_ID_HELPER_TEXTS.VOTER_ID).toBe(
      'Enter the 10-digit Voter ID number exactly as shown on the Voter ID card.',
    );
    expect(BORROWER_ID_ERROR_MESSAGES.VOTER_ID).toBe(
      'Voter ID must contain exactly 10 digits.',
    );
  });
});

describe('guarantor relationship options', () => {
  it('includes Group Leader', async () => {
    const { GUARANTOR_RELATIONSHIP_OPTIONS } = await import('@/constants/borrower-registration');
    expect(GUARANTOR_RELATIONSHIP_OPTIONS).toContain('Group Leader');
  });
});
