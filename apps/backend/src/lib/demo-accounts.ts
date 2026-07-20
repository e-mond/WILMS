import { DEMO_USERS } from '../seed/demo-users.js';

const DEMO_EMAIL_SUFFIX = '@wilms.demo';

/** True when NODE_ENV is production and demo seed override is not enabled. */
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true';
}

export function isDemoEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith(DEMO_EMAIL_SUFFIX)) {
    return true;
  }
  return DEMO_USERS.some((user) => user.email.toLowerCase() === normalized);
}

/**
 * Demo accounts are for local/staging only. Production login must reject them even if
 * they were historically seeded into the database.
 */
export function assertDemoLoginAllowed(email: string): void {
  if (isProductionRuntime() && isDemoEmail(email)) {
    throw new Error('DEMO_LOGIN_BLOCKED');
  }
}

export function shouldSeedDemoUsers(): boolean {
  return !isProductionRuntime();
}
