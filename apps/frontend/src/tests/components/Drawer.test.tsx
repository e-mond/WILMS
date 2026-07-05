import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from '@/components/ui/Drawer';

describe('Drawer', () => {
  it('does not render when closed', () => {
    render(
      <Drawer isOpen={false} onClose={vi.fn()} title="Navigation">
        <p>Menu content</p>
      </Drawer>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with focus trap controls when open', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Drawer isOpen onClose={onClose} title="Navigation">
        <a href="/dashboard">Dashboard</a>
      </Drawer>,
    );

    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Drawer isOpen onClose={onClose} title="Navigation">
        <p>Menu</p>
      </Drawer>,
    );

    await user.click(screen.getAllByRole('button', { name: 'Close drawer overlay' })[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
