import { validateUploadEnvironment } from '../infrastructure/uploads/env-validation.js';
import { env } from './env.js';

export interface EnvValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * RC-056 / P14.5A — startup environment validation (no secret values logged).
 */
export function validateEnvironment(): EnvValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (env.nodeEnv === 'production') {
    if (!env.databaseUrl) {
      errors.push('DATABASE_URL is required in production.');
    }
    if (
      env.sessionSecret === 'wilms-dev-session-secret-change-me' ||
      env.sessionSecret === 'wilms-build-placeholder-secret-do-not-use'
    ) {
      errors.push('WILMS_SESSION_SECRET must be set in production.');
    }
    const serverless =
      process.env.WILMS_RUNTIME?.trim().toLowerCase() === 'serverless' ||
      process.env.WILMS_RUNTIME?.trim().toLowerCase() === 'vercel' ||
      Boolean(process.env.VERCEL);
    if (!serverless && !process.env.WILMS_CORS_ORIGIN?.trim()) {
      errors.push('WILMS_CORS_ORIGIN is required in production for the Node API process.');
    }
    if (serverless && !env.redisUrl) {
      errors.push(
        'REDIS_URL or WILMS_REDIS_URL is required in serverless production for shared rate limiting.',
      );
    } else if (!env.redisUrl) {
      warnings.push(
        'REDIS_URL / WILMS_REDIS_URL is unset — rate limits are in-memory and will not share across instances.',
      );
    }
  }

  if (env.port <= 0 || Number.isNaN(env.port)) {
    errors.push('WILMS_API_PORT must be a positive integer.');
  }

  if (env.minGroupSize <= 0 || env.maxGroupSize < env.minGroupSize) {
    errors.push('WILMS_MIN_GROUP_SIZE / WILMS_MAX_GROUP_SIZE are invalid.');
  }

  const uploadReport = validateUploadEnvironment();
  for (const error of uploadReport.errors) {
    errors.push(error);
  }
  for (const warning of uploadReport.warnings) {
    warnings.push(warning);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
