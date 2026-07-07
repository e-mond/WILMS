import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Confirm payment">
        Body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with title and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose} title="Confirm payment">
        Payment details
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Confirm payment' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when close button is activated', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose} title="Confirm payment">
        Body
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps focus in an input when modal content re-renders', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState('');
      return (
        <Modal isOpen onClose={vi.fn()} title="Create pool">
          <input aria-label="Pool name" value={value} onChange={(event) => setValue(event.target.value)} />
        </Modal>
      );
    }

    render(<Harness />);

    const input = screen.getByRole('textbox', { name: 'Pool name' });
    await user.click(input);
    await user.type(input, 'North');

    expect(input).toHaveValue('North');
    expect(input).toHaveFocus();
  });
});
