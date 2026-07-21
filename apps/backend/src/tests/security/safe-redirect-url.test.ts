import { describe, expect, it } from 'vitest';
import { validateSafeRedirectUrl } from '../../lib/safe-redirect-url.js';

describe('validateSafeRedirectUrl', () => {
  it('allows same-app HTTPS destinations', () => {
    expect(validateSafeRedirectUrl('https://wilms.vercel.app/login')).toBe(
      'https://wilms.vercel.app/login',
    );
  });

  it('blocks external phishing domains', () => {
    const result = validateSafeRedirectUrl('https://evil.example/phish');
    expect(result).not.toContain('evil.example');
    expect(result.startsWith('https://')).toBe(true);
  });

  it('blocks javascript URLs', () => {
    const result = validateSafeRedirectUrl('javascript:alert(1)');
    expect(result).not.toContain('javascript');
  });
});
