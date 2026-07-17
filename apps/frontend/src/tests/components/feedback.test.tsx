import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';

describe('feedback components', () => {
  it('renders Alert with alert role', () => {
    render(<Alert title="Reconciliation mismatch">Variance detected.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Reconciliation mismatch');
  });

  it('renders InlinePanelSkeleton with busy state', () => {
    const { container } = render(<InlinePanelSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders EmptyState with title and description', () => {
    render(
      <EmptyState
        title="No borrowers found"
        description="Try adjusting your filters."
      />,
    );
    expect(screen.getByRole('heading', { name: 'No borrowers found' })).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });
});
