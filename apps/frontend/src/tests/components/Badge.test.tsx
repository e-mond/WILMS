import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders visible text for status', () => {
    render(<Badge variant="warning">At Risk</Badge>);
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('supports semantic status tokens', () => {
    render(<Badge statusToken="pending">Pending</Badge>);
    expect(screen.getByText('Pending').className).toContain('text-status-pending');
  });
});
