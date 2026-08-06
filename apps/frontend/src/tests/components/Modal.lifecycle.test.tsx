import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '@/components/ui/Modal';

describe('Modal portal lifecycle', () => {
  it('opens and closes without throwing removeChild races', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender, unmount } = render(
      <Modal isOpen onClose={onClose} title="Lifecycle">
        <button type="button">Inside</button>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Lifecycle' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();

    rerender(
      <Modal isOpen={false} onClose={onClose} title="Lifecycle">
        <button type="button">Inside</button>
      </Modal>,
    );

    expect(screen.queryByRole('dialog', { name: 'Lifecycle' })).not.toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
