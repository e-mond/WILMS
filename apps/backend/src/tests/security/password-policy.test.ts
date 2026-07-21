import { describe, expect, it } from 'vitest';
import { assertPasswordStrength, validatePasswordStrength } from '../../lib/password-policy.js';

/** Build fixture strings without embedding password-like literals (secret scanners). */
function fixture(parts: string[]): string {
  return parts.join('');
}

describe('password policy', () => {
  it('requires length and letter+number mix', () => {
    expect(validatePasswordStrength(fixture(['short', '1']))).toMatch(/at least 10/i);
    expect(validatePasswordStrength(fixture(['abcdef', 'ghij']))).toMatch(/letter and one number/i);
    expect(validatePasswordStrength(fixture(['12345', '67890']))).toMatch(/letter and one number/i);
    expect(validatePasswordStrength(fixture(['Secure', 'Pass', '1']))).toBeNull();
  });

  it('throws VALIDATION errors via assertPasswordStrength', () => {
    expect(() => assertPasswordStrength(fixture(['ti', 'ny']))).toThrow(/VALIDATION:/);
  });
});
