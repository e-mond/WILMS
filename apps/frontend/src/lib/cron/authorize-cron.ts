import { timingSafeEqual } from 'node:crypto';

function tokenOk(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export type CronAuthEnv = Record<string, string | undefined>;

export interface CronAuthDecision {
  allowed: boolean;
  reason:
    | 'cron_secret'
    | 'scheduler_token'
    | 'missing_credentials'
    | 'invalid_credentials'
    | 'unauthenticated';
  cronSecretConfigured: boolean;
  schedulerTokenConfigured: boolean;
}

/**
 * Authorise `/api/cron/notifications`.
 *
 * Production Vercel Cron authenticates with `Authorization: Bearer $CRON_SECRET`
 * when `CRON_SECRET` is configured. `WILMS_SCHEDULER_TOKEN` remains valid for
 * manual and non-Vercel scheduler invocations.
 *
 * `x-vercel-cron` is not treated as authentication: that header can be spoofed.
 */
export function inspectCronAuthorization(
  request: Request,
  env: CronAuthEnv = process.env,
): CronAuthDecision {
  const header = request.headers.get('authorization');
  const bearer = header?.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null;
  const alt = request.headers.get('x-wilms-scheduler-token')?.trim() ?? null;
  const schedulerToken = env.WILMS_SCHEDULER_TOKEN?.trim();
  const cronSecret = env.CRON_SECRET?.trim();
  const cronSecretConfigured = Boolean(cronSecret);
  const schedulerTokenConfigured = Boolean(schedulerToken);

  if (tokenOk(bearer, cronSecret)) {
    return {
      allowed: true,
      reason: 'cron_secret',
      cronSecretConfigured,
      schedulerTokenConfigured,
    };
  }

  if (tokenOk(bearer, schedulerToken) || tokenOk(alt, schedulerToken)) {
    return {
      allowed: true,
      reason: 'scheduler_token',
      cronSecretConfigured,
      schedulerTokenConfigured,
    };
  }

  if (!cronSecretConfigured && !schedulerTokenConfigured) {
    return {
      allowed: false,
      reason: 'missing_credentials',
      cronSecretConfigured,
      schedulerTokenConfigured,
    };
  }

  if (bearer || alt) {
    return {
      allowed: false,
      reason: 'invalid_credentials',
      cronSecretConfigured,
      schedulerTokenConfigured,
    };
  }

  return {
    allowed: false,
    reason: 'unauthenticated',
    cronSecretConfigured,
    schedulerTokenConfigured,
  };
}

export function authorizeCronRequest(
  request: Request,
  env: CronAuthEnv = process.env,
): boolean {
  return inspectCronAuthorization(request, env).allowed;
}
