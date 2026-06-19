import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordField } from '@/components/forms/PasswordField';

describe('PasswordField', () => {
  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordField id="password" label="Password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Toggle password visibility' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Toggle password visibility' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders validation error message', () => {
    render(
      <PasswordField
        id="password"
        label="Password"
        hasError
        errorId="password-error"
        errorMessage="Password is required."
      />,
    );

    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
  });
});
