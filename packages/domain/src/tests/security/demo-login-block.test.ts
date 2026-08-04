import { afterEach, describe, expect, it } from 'vitest';
import {
  assertDemoLoginAllowed,
  isDemoEmail,
  shouldSeedDemoUsers,
} from '../../lib/demo-accounts.js';

describe('demo account production guards', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllow = process.env.ALLOW_DEMO_SEED;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousAllow === undefined) {
      delete process.env.ALLOW_DEMO_SEED;
    } else {
      process.env.ALLOW_DEMO_SEED = previousAllow;
    }
  });

  it('recognises @wilms.demo emails', () => {
    expect(isDemoEmail('admin@wilms.demo')).toBe(true);
    expect(isDemoEmail('ops@example.com')).toBe(false);
  });

  it('blocks demo login in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_SEED;
    expect(() => assertDemoLoginAllowed('admin@wilms.demo')).toThrow('DEMO_LOGIN_BLOCKED');
    expect(shouldSeedDemoUsers()).toBe(false);
  });

  it('allows demo login outside production', () => {
    process.env.NODE_ENV = 'development';
    expect(() => assertDemoLoginAllowed('admin@wilms.demo')).not.toThrow();
    expect(shouldSeedDemoUsers()).toBe(true);
  });
});
