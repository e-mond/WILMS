import { describe, expect, it } from 'vitest';
import { resolveShellPageTitle } from '@/utils/shell-page-title';

describe('resolveShellPageTitle', () => {
  it('resolves exact dashboard title', () => {
    expect(resolveShellPageTitle('/dashboard')).toBe('Operational Dashboard');
  });

  it('resolves operations control-centre title distinctly from dashboard', () => {
    expect(resolveShellPageTitle('/ops')).toBe('Operations');
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

  it('resolves borrowers, applications, records, and update requests', () => {
    expect(resolveShellPageTitle('/borrowers')).toBe('Borrowers');
    expect(resolveShellPageTitle('/borrowers', 'status=PENDING')).toBe('Applications');
    expect(resolveShellPageTitle('/records')).toBe('Borrower Records');
    expect(resolveShellPageTitle('/borrower-updates')).toBe('Requests');
  });
});
