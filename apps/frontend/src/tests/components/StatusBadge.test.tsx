import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { BORROWER_STATUS } from '@/types/borrower';

describe('StatusBadge', () => {
  it('renders borrower status labels', () => {
    render(<StatusBadge status={BORROWER_STATUS.PENDING} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders at risk status', () => {
    render(<StatusBadge status={BORROWER_STATUS.AT_RISK} />);
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('renders defaulted status', () => {
    render(<StatusBadge status={BORROWER_STATUS.DEFAULTED} />);
    expect(screen.getByText('Defaulted')).toBeInTheDocument();
  });

  it('renders approved status', () => {
    render(<StatusBadge status={BORROWER_STATUS.APPROVED} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
