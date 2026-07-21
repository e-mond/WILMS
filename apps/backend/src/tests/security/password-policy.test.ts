import { describe, expect, it } from 'vitest';
import { assertPasswordStrength, validatePasswordStrength } from '../../lib/password-policy.js';

describe('password policy', () => {
  it('requires length and letter+number mix', () => {
    expect(validatePasswordStrength('short1')).toMatch(/at least 10/i);
    expect(validatePasswordStrength('abcdefghij')).toMatch(/letter and one number/i);
    expect(validatePasswordStrength('1234567890')).toMatch(/letter and one number/i);
    expect(validatePasswordStrength('SecurePass1')).toBeNull();
  });

  it('throws VALIDATION errors via assertPasswordStrength', () => {
    expect(() => assertPasswordStrength('tiny')).toThrow(/VALIDATION:/);
  });
});
