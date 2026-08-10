import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { resolveKpiIcon } from '@/components/data-display/resolveKpiIcon';
import { KpiCard } from '@/components/data-display/KpiCard';

describe('resolveKpiIcon', () => {
  it('returns an icon for common KPI labels', () => {
    for (const label of [
      'Portfolio',
      'Outstanding',
      'Collection rate',
      'Active groups',
      'PAR90 rate',
      'Borrowers managed',
      'Reconciliation',
    ]) {
      const node = resolveKpiIcon(label);
      const { container } = render(<span>{node}</span>);
      expect(container.querySelector('svg')).not.toBeNull();
    }
  });
});

describe('KpiCard icons', () => {
  it('renders a default icon when none is provided', () => {
    const { container } = render(<KpiCard label="Active loans" value={12} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
