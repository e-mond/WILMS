import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BorrowersAsidePanel } from '@/features/borrower-management/components/BorrowersAsidePanel';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

vi.mock('@/hooks/usePermissions', () => ({
  usePermission: () => true,
  usePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
    isLoading: false,
    permissionIds: new Set(),
    overrides: [],
    roleId: null,
  }),
}));

describe('BorrowersAsidePanel quick actions', () => {
  it('renders permission-aware production quick actions', () => {
    render(
      <TestQueryProvider>
        <BorrowersAsidePanel totalBorrowers={12} approvedCount={10} atRiskCount={1} exportRows={[]} />
      </TestQueryProvider>,
    );

    const panel = screen.getByTestId('borrowers-quick-actions');
    expect(panel).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add Borrower' })).toHaveAttribute(
      'href',
      '/borrowers/new',
    );
    expect(screen.getByRole('link', { name: 'Import Borrowers' })).toHaveAttribute(
      'href',
      '/borrowers/import',
    );
    expect(screen.getByRole('link', { name: 'Assign Group' })).toHaveAttribute('href', '/groups');
    expect(screen.getByRole('link', { name: 'Reassign Collector' })).toHaveAttribute(
      'href',
      '/ops/reassignment',
    );
    expect(screen.getByRole('link', { name: 'View Pending Registrations' })).toHaveAttribute(
      'href',
      '/borrowers?status=PENDING',
    );
    expect(screen.getByRole('button', { name: /Export Borrowers/i })).toBeInTheDocument();
  });
});
