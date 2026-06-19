import { afterEach, describe, expect, it, vi } from 'vitest';
import { analytics } from '@/services/analytics';
import type { AnalyticsProvider } from '@/types/observability';

describe('analytics', () => {
  afterEach(() => {
    analytics.resetProvider();
  });

  it('routes events through the active provider', () => {
    const provider: AnalyticsProvider = {
      trackEvent: vi.fn(),
      trackPageView: vi.fn(),
      identify: vi.fn(),
    };

    analytics.setProvider(provider);
    analytics.trackEvent('payment_recorded', { amountPesewas: 5000 });
    analytics.trackPageView('/collector/dashboard');
    analytics.identify('user-1', { role: 'COLLECTOR' });

    expect(provider.trackEvent).toHaveBeenCalledWith('payment_recorded', {
      amountPesewas: 5000,
    });
    expect(provider.trackPageView).toHaveBeenCalledWith('/collector/dashboard', undefined);
    expect(provider.identify).toHaveBeenCalledWith('user-1', { role: 'COLLECTOR' });
  });
});
