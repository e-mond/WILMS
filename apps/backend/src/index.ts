import './config/load-env.js';
import type { Server } from 'node:http';
import { createApp } from './http/app.js';
import { env } from './config/env.js';
import { validateEnvironment } from './config/validate-env.js';
import { assertProductionMockDisabled } from './config/mock-guard.js';
import { isDatabaseEnabled } from './db/client.js';
import { logger } from './infrastructure/logging/logger.js';
import { getMailProvider } from './infrastructure/mail/index.js';
import { getSmsProvider } from './infrastructure/sms/index.js';
import { validateUploadEnvironment } from './infrastructure/uploads/index.js';

const envReport = validateEnvironment();

assertProductionMockDisabled();

process.env.WILMS_DEPLOYED_AT ??= new Date().toISOString();

for (const warning of envReport.warnings) {
  logger.warn('startup.env.warning', { warning });
}

if (!envReport.valid) {
  for (const error of envReport.errors) {
    logger.error('startup.env.error', { error });
  }
  if (env.nodeEnv === 'production') {
    process.exit(1);
  }
}

const app = createApp();
let server: Server | undefined;

function shutdown(signal: string): void {
  logger.info('shutdown.start', { signal });
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(() => {
    logger.info('shutdown.complete', { signal });
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('shutdown.forced', { signal });
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('process.unhandledRejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});
process.on('uncaughtException', (error) => {
  logger.error('process.uncaughtException', { message: error.message });
  shutdown('uncaughtException');
});

server = app.listen(env.port, env.host, () => {
  const persistence = isDatabaseEnabled() ? 'postgresql (Neon)' : 'in-memory';
  const uploadReport = validateUploadEnvironment();
  const mailProvider = getMailProvider().name;
  const smsProvider = getSmsProvider().name;

  logger.info('startup.complete', {
    host: env.host,
    port: env.port,
    persistence,
    uploadProvider: uploadReport.activeProvider,
    uploadRequested: uploadReport.provider,
    mailProvider,
    smsProvider,
    gitCommit: env.gitCommit ?? null,
  });

  for (const warning of uploadReport.warnings) {
    logger.warn('uploads.warning', { warning });
  }

  for (const error of uploadReport.errors) {
    logger.error('uploads.error', { error });
  }

  if (!uploadReport.valid && env.nodeEnv === 'production') {
    logger.error('uploads.invalidProductionConfig', {});
  }
});

export { app, server };
