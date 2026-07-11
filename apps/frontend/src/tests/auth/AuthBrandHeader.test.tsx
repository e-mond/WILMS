import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AUTH_APPLICATION_NAME,
  AUTH_MISSION_TAGLINE,
  AuthBrandHeader,
} from '@/features/authentication/components/AuthBrandHeader';

describe('AuthBrandHeader', () => {
  it('shows logo, application name, and mission tagline without redundant WILMS heading', () => {
    render(<AuthBrandHeader />);

    expect(screen.getByRole('img', { name: 'WILMS' })).toBeInTheDocument();
    expect(screen.getByText(AUTH_APPLICATION_NAME)).toBeInTheDocument();
    expect(screen.getByText(AUTH_MISSION_TAGLINE)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'WILMS' })).not.toBeInTheDocument();
    expect(screen.queryByText('WILMS', { selector: 'p' })).not.toBeInTheDocument();
  });
});
