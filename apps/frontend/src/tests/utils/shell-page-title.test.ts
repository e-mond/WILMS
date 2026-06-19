import { describe, expect, it } from 'vitest';
import { resolveShellPageTitle } from '@/utils/shell-page-title';

describe('resolveShellPageTitle', () => {
  it('resolves exact dashboard title', () => {
    expect(resolveShellPageTitle('/dashboard')).toBe('Super Admin Dashboard');
  });

  it('resolves dynamic borrower profile routes', () => {
    expect(resolveShellPageTitle('/borrowers/borrower-1')).toBe('Borrower Profile');
  });

  it('resolves loan detail under borrower', () => {
    expect(resolveShellPageTitle('/borrowers/borrower-1/loan')).toBe('Loan Detail');
  });

  it('falls back to WILMS for unknown routes', () => {
    expect(resolveShellPageTitle('/unknown')).toBe('WILMS');
  });
});
