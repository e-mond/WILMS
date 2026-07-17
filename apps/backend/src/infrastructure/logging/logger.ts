import { getRequestId } from '../../middleware/request-id.js';

type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: 'wilms-api';
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
  const requestId = getRequestId();
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'wilms-api',
    ...(requestId ? { requestId } : {}),
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};
