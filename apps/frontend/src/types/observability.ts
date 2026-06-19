export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

export interface LogProvider {
  log(level: LogLevel, message: string, context?: LogContext): void;
}

export type AnalyticsEventProperties = Record<string, unknown>;

export interface AnalyticsUserTraits {
  id?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AnalyticsProvider {
  trackEvent(event: string, properties?: AnalyticsEventProperties): void;
  trackPageView(path: string, properties?: AnalyticsEventProperties): void;
  identify(userId: string, traits?: AnalyticsUserTraits): void;
}

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export type ErrorContext = Record<string, unknown>;

export interface ErrorTrackingUser {
  id: string;
  role?: string;
  email?: string;
}

export interface ErrorTrackingProvider {
  captureException(error: unknown, context?: ErrorContext): void;
  captureMessage(message: string, severity?: ErrorSeverity, context?: ErrorContext): void;
  setUser(user: ErrorTrackingUser | null): void;
}
