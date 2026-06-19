import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SessionExpiredPage from '@/app/(auth)/session-expired/page';

describe('SessionExpiredPage', () => {
  it('links back to login with preserved next path', () => {
    render(<SessionExpiredPage searchParams={{ next: '/collector/dashboard' }} />);

    expect(screen.getByRole('heading', { name: 'Session expired' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to sign in' })).toHaveAttribute(
      'href',
      '/login?next=%2Fcollector%2Fdashboard',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('offline payments remain');
  });
});
