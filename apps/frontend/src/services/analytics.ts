import type {
  AnalyticsEventProperties,
  AnalyticsProvider,
  AnalyticsUserTraits,
} from '@/types/observability';

class NoOpAnalyticsProvider implements AnalyticsProvider {
  trackEvent(): void {}

  trackPageView(): void {}

  identify(): void {}
}

class ConsoleAnalyticsProvider implements AnalyticsProvider {
  trackEvent(event: string, properties?: AnalyticsEventProperties): void {
    console.info('[WILMS:analytics:event]', event, properties ?? {});
  }

  trackPageView(path: string, properties?: AnalyticsEventProperties): void {
    console.info('[WILMS:analytics:page]', path, properties ?? {});
  }

  identify(userId: string, traits?: AnalyticsUserTraits): void {
    console.info('[WILMS:analytics:identify]', userId, traits ?? {});
  }
}

function createDefaultAnalyticsProvider(): AnalyticsProvider {
  if (process.env.NODE_ENV === 'development') {
    return new ConsoleAnalyticsProvider();
  }

  return new NoOpAnalyticsProvider();
}

let provider: AnalyticsProvider = createDefaultAnalyticsProvider();

export const analytics = {
  setProvider(nextProvider: AnalyticsProvider): void {
    provider = nextProvider;
  },

  resetProvider(): void {
    provider = createDefaultAnalyticsProvider();
  },

  trackEvent(event: string, properties?: AnalyticsEventProperties): void {
    provider.trackEvent(event, properties);
  },

  trackPageView(path: string, properties?: AnalyticsEventProperties): void {
    provider.trackPageView(path, properties);
  },

  identify(userId: string, traits?: AnalyticsUserTraits): void {
    provider.identify(userId, traits);
  },
};
