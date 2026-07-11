import { describe, expect, it } from 'vitest';
import {
  AuthBrandHeader,
  AUTH_APPLICATION_NAME,
} from '@/features/authentication/components/AuthBrandHeader';
import { render, screen } from '@testing-library/react';

describe('AuthBrandHeader', () => {
  it('shows logo and application name without mission tagline', () => {
    render(<AuthBrandHeader />);

    expect(screen.getByRole('img', { name: 'WILMS' })).toBeInTheDocument();
    expect(screen.getByText(AUTH_APPLICATION_NAME)).toBeInTheDocument();
    expect(
      screen.queryByText('Helping women grow through interest-free financing.'),
    ).not.toBeInTheDocument();
  });
});
