/**
 * Production password policy for onboarding and resets.
 * Temporary invite passwords may be shorter (generated separately).
 */
export const PASSWORD_MIN_LENGTH = 10;

export function validatePasswordStrength(password: string): string | null {
  const value = password.trim();
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

export function assertPasswordStrength(password: string): void {
  const error = validatePasswordStrength(password);
  if (error) {
    throw new Error(`VALIDATION:${error}`);
  }
}
