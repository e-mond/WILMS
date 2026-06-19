import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_MODE_MESSAGE } from '@/config/demo';
import { DemoModeBanner } from '@/components/feedback/DemoModeBanner';

describe('DemoModeBanner', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('announces demo mode to screen readers in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    render(<DemoModeBanner />);

    expect(screen.getByRole('status')).toHaveTextContent(DEMO_MODE_MESSAGE);
    expect(screen.getByRole('status')).toHaveClass('bg-warning-light');
  });

  it('renders nothing when API provider mode is active', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.wilms.example');

    const { container } = render(<DemoModeBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders demo banner in test environment when mock provider is active', () => {
    render(<DemoModeBanner />);

    expect(screen.getByRole('status')).toHaveTextContent(DEMO_MODE_MESSAGE);
  });
});
