import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShellNavLink } from '@/layouts/ShellNavLink';

vi.mock('next/navigation', () => ({
  usePathname: () => '/collector/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

describe('ShellNavLink', () => {
  it('marks the active route with aria-current', () => {
    render(<ShellNavLink href="/collector/dashboard" label="Dashboard" exact />);

    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive routes as current', () => {
    render(<ShellNavLink href="/collector/reconciliation" label="Reconciliation" />);

    const link = screen.getByRole('link', { name: 'Reconciliation' });
    expect(link).not.toHaveAttribute('aria-current');
  });
});
