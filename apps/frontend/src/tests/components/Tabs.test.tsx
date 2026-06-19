import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs, type TabItem } from '@/components/ui/Tabs';

const ITEMS: TabItem[] = [
  { id: 'overview', label: 'Overview', panel: <p>Overview panel</p> },
  { id: 'history', label: 'History', panel: <p>History panel</p> },
];

function TabsHarness() {
  const [activeId, setActiveId] = useState('overview');

  return <Tabs items={ITEMS} activeId={activeId} onChange={setActiveId} ariaLabel="Loan tabs" />;
}

describe('Tabs', () => {
  it('renders tablist and active panel', () => {
    render(<TabsHarness />);

    expect(screen.getByRole('tablist', { name: 'Loan tabs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument();
    expect(screen.getByText('Overview panel')).toBeInTheDocument();
  });

  it('switches panels when another tab is selected', async () => {
    const user = userEvent.setup();
    render(<TabsHarness />);

    await user.click(screen.getByRole('tab', { name: 'History' }));

    expect(screen.getByRole('tab', { name: 'History', selected: true })).toBeInTheDocument();
    expect(screen.getByText('History panel')).toBeInTheDocument();
  });
});
