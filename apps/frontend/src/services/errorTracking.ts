import type {
  ErrorContext,
  ErrorSeverity,
  ErrorTrackingProvider,
  ErrorTrackingUser,
} from '@/types/observability';

class NoOpErrorTrackingProvider implements ErrorTrackingProvider {
  captureException(): void {}

  captureMessage(): void {}

  setUser(): void {}
}

class ConsoleErrorTrackingProvider implements ErrorTrackingProvider {
  captureException(error: unknown, context?: ErrorContext): void {
    console.error('[WILMS:error:exception]', error, context ?? {});
  }

  captureMessage(
    message: string,
    severity: ErrorSeverity = 'error',
    context?: ErrorContext,
  ): void {
    const payload = { severity, context: context ?? {} };

    if (severity === 'warning' || severity === 'info') {
      console.warn('[WILMS:error:message]', message, payload);
      return;
    }

    console.error('[WILMS:error:message]', message, payload);
  }

  setUser(user: ErrorTrackingUser | null): void {
    console.info('[WILMS:error:user]', user);
  }
}

function createDefaultErrorTrackingProvider(): ErrorTrackingProvider {
  if (process.env.NODE_ENV === 'development') {
    return new ConsoleErrorTrackingProvider();
  }

  return new NoOpErrorTrackingProvider();
}

let provider: ErrorTrackingProvider = createDefaultErrorTrackingProvider();

export const errorTracking = {
  setProvider(nextProvider: ErrorTrackingProvider): void {
    provider = nextProvider;
  },

  resetProvider(): void {
    provider = createDefaultErrorTrackingProvider();
  },

  captureException(error: unknown, context?: ErrorContext): void {
    provider.captureException(error, context);
  },

  captureMessage(
    message: string,
    severity: ErrorSeverity = 'error',
    context?: ErrorContext,
  ): void {
    provider.captureMessage(message, severity, context);
  },

  setUser(user: ErrorTrackingUser | null): void {
    provider.setUser(user);
  },
};
