import { describe, expect, it } from 'vitest';
import { isShellNavLinkActive } from '@/layouts/ShellNavLink';

describe('isShellNavLinkActive', () => {
  it('marks query-specific Applications nav active on pending borrowers', () => {
    expect(
      isShellNavLinkActive('/borrowers', 'status=PENDING', '/borrowers?status=PENDING'),
    ).toBe(true);
  });

  it('does not mark Borrowers nav active when Applications query is present', () => {
    expect(isShellNavLinkActive('/borrowers', 'status=PENDING', '/borrowers')).toBe(false);
  });

  it('marks Borrowers nav active on the default directory route', () => {
    expect(isShellNavLinkActive('/borrowers', '', '/borrowers')).toBe(true);
  });

  it('does not mark Reports nav active on daily collection report', () => {
    expect(isShellNavLinkActive('/reports/daily-collection', '', '/reports')).toBe(false);
    expect(
      isShellNavLinkActive('/reports/daily-collection', '', '/reports/daily-collection'),
    ).toBe(true);
  });

  it('does not mark Collections nav active on reports index', () => {
    expect(isShellNavLinkActive('/reports', '', '/reports/daily-collection')).toBe(false);
  });
});
