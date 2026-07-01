import { describe, expect, it } from 'vitest';
import {
  BORROWER_ID_PLACEHOLDERS,
  formatGhanaCardInput,
  normalizeBorrowerId,
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

  it('accepts voter ID formats', () => {
    expect(validateBorrowerId('VOTER_ID', '1234567890').valid).toBe(true);
    expect(validateBorrowerId('VOTER_ID', '1234-5678-9012').valid).toBe(true);
  });

  it('rejects invalid voter IDs', () => {
    expect(validateBorrowerId('VOTER_ID', '123').valid).toBe(false);
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
  });
});
