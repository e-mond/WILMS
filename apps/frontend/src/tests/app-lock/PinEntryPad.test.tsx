import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PinEntryPad } from '@/features/app-lock/components/PinEntryPad';

describe('PinEntryPad', () => {
  it('submits a six-digit pin', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<PinEntryPad label="Enter PIN" onComplete={onComplete} />);

    for (const digit of ['1', '2', '3', '4', '5', '6']) {
      await user.click(screen.getByRole('button', { name: `Digit ${digit}` }));
    }

    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('accepts keyboard digits and Enter', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<PinEntryPad label="Enter PIN" onComplete={onComplete} />);

    await user.click(screen.getByLabelText('Enter PIN'));
    await user.keyboard('123456');

    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('clears entered digits', async () => {
    const user = userEvent.setup();

    render(<PinEntryPad label="Enter PIN" onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Digit 1' }));
    await user.click(screen.getByRole('button', { name: 'Clear PIN' }));

    expect(screen.getByText('Enter PIN')).toBeInTheDocument();
  });
});
