import { describe, expect, it } from 'vitest';
import {
  BORROWER_ID_ERROR_MESSAGES,
  BORROWER_ID_PLACEHOLDERS,
  formatGhanaCardInput,
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

  it('accepts alphanumeric voter IDs such as A01010', () => {
    expect(validateBorrowerId('VOTER_ID', 'A01010').valid).toBe(true);
    expect(normalizeBorrowerId('VOTER_ID', 'A01010')).toBe('A01010');
  });

  it('normalizes lowercase voter IDs to uppercase', () => {
    expect(normalizeVoterId('a01010')).toBe('A01010');
    expect(normalizeBorrowerId('VOTER_ID', 'a01010')).toBe('A01010');
    expect(validateBorrowerId('VOTER_ID', 'a01010').valid).toBe(true);
  });

  it('accepts realistic alphanumeric and numeric voter ID formats', () => {
    expect(validateBorrowerId('VOTER_ID', 'B123456789').valid).toBe(true);
    expect(validateBorrowerId('VOTER_ID', '1234567890').valid).toBe(true);
    expect(validateBorrowerId('VOTER_ID', '1234-5678-9012').valid).toBe(true);
    expect(normalizeBorrowerId('VOTER_ID', 'ab-12 34')).toBe('AB1234');
  });

  it('rejects empty, whitespace-only, too-short, and special-character voter IDs', () => {
    expect(validateBorrowerId('VOTER_ID', '').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '   ').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '123').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', 'A01@10').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', 'A01010!').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '123').error).toBe(BORROWER_ID_ERROR_MESSAGES.VOTER_ID);
  });

  it('does not apply voter ID rules to Ghana Card or Passport', () => {
    expect(validateBorrowerId('GHANA_CARD', 'A01010').valid).toBe(false);
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

  it('exposes placeholders per ID type', () => {
    expect(BORROWER_ID_PLACEHOLDERS.GHANA_CARD).toBe('GHA-123456789-0');
    expect(BORROWER_ID_PLACEHOLDERS.VOTER_ID).toBe('A01010');
  });
});
