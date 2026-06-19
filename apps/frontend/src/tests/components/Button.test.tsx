import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with accessible button semantics', () => {
    render(<Button>Save payment</Button>);
    expect(screen.getByRole('button', { name: 'Save payment' })).toBeInTheDocument();
  });

  it('supports variant and disabled state', () => {
    render(
      <Button variant="danger" disabled>
        Delete
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continue</Button>);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
