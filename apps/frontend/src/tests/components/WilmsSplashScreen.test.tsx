import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WilmsSplashScreen } from '@/components/feedback/WilmsSplashScreen';

describe('WilmsSplashScreen', () => {
  it('renders branded splash with status message', () => {
    render(<WilmsSplashScreen message="Restoring your session..." />);

    expect(screen.getByText('WILMS')).toBeInTheDocument();
    expect(screen.getByText("Women's Interest-Free Loan Management")).toBeInTheDocument();
    expect(screen.getByLabelText('Restoring your session...')).toBeInTheDocument();
  });
});
