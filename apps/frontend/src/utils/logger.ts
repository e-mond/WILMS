import type { LogContext, LogLevel, LogProvider } from '@/types/observability';

class NoOpLogProvider implements LogProvider {
  log(): void {
    // Intentionally silent in production and test environments.
  }
}

class ConsoleLogProvider implements LogProvider {
  log(level: LogLevel, message: string, context?: LogContext): void {
    const prefix = `[WILMS:${level}]`;

    if (context) {
      switch (level) {
        case 'debug':
        case 'info':
          console.info(prefix, message, context);
          break;
        case 'warn':
          console.warn(prefix, message, context);
          break;
        case 'error':
          console.error(prefix, message, context);
          break;
      }
      return;
    }

    switch (level) {
      case 'debug':
      case 'info':
        console.info(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
    }
  }
}

function createDefaultLogProvider(): LogProvider {
  if (process.env.NODE_ENV === 'development') {
    return new ConsoleLogProvider();
  }

  return new NoOpLogProvider();
}

let provider: LogProvider = createDefaultLogProvider();

export const logger = {
  setProvider(nextProvider: LogProvider): void {
    provider = nextProvider;
  },

  resetProvider(): void {
    provider = createDefaultLogProvider();
  },

  debug(message: string, context?: LogContext): void {
    provider.log('debug', message, context);
  },

  info(message: string, context?: LogContext): void {
    provider.log('info', message, context);
  },

  warn(message: string, context?: LogContext): void {
    provider.log('warn', message, context);
  },

  error(message: string, context?: LogContext): void {
    provider.log('error', message, context);
  },
};
