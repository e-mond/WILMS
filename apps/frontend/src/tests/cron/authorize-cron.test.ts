import { describe, expect, it } from 'vitest';
import {
  authorizeCronRequest,
  inspectCronAuthorization,
} from '@/lib/cron/authorize-cron';

function requestWith(headers: Record<string, string>): Request {
  return new Request('https://wilms.vercel.app/api/cron/notifications', { headers });
}

describe('authorizeCronRequest', () => {
  it('accepts Bearer CRON_SECRET', () => {
    expect(
      authorizeCronRequest(requestWith({ authorization: 'Bearer cron-secret' }), {
        CRON_SECRET: 'cron-secret',
      }),
    ).toBe(true);
  });

  it('accepts Bearer WILMS_SCHEDULER_TOKEN for manual invocation', () => {
    expect(
      authorizeCronRequest(requestWith({ authorization: 'Bearer scheduler-secret' }), {
        WILMS_SCHEDULER_TOKEN: 'scheduler-secret',
      }),
    ).toBe(true);
  });

  it('accepts x-wilms-scheduler-token for non-Vercel runners', () => {
    expect(
      authorizeCronRequest(requestWith({ 'x-wilms-scheduler-token': 'scheduler-secret' }), {
        WILMS_SCHEDULER_TOKEN: 'scheduler-secret',
      }),
    ).toBe(true);
  });

  it('rejects a public unauthenticated request', () => {
    const decision = inspectCronAuthorization(requestWith({}), {
      CRON_SECRET: 'cron-secret',
      WILMS_SCHEDULER_TOKEN: 'scheduler-secret',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('unauthenticated');
  });

  it('rejects an invalid secret', () => {
    const decision = inspectCronAuthorization(
      requestWith({ authorization: 'Bearer wrong' }),
      { CRON_SECRET: 'cron-secret' },
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('invalid_credentials');
  });

  it('does not treat x-vercel-cron as authentication', () => {
    expect(
      authorizeCronRequest(requestWith({ 'x-vercel-cron': '1' }), {
        CRON_SECRET: 'cron-secret',
      }),
    ).toBe(false);
    expect(
      authorizeCronRequest(requestWith({ 'x-vercel-cron': '1' }), {
        WILMS_SCHEDULER_TOKEN: 'scheduler-secret',
      }),
    ).toBe(false);
    expect(
      authorizeCronRequest(requestWith({ 'x-vercel-cron': '1' }), {}),
    ).toBe(false);
  });

  it('fails closed when no secrets are configured', () => {
    const decision = inspectCronAuthorization(
      requestWith({ authorization: 'Bearer anything' }),
      {},
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('missing_credentials');
  });

  it('allows test/dev invocation when a local scheduler token is supplied', () => {
    expect(
      authorizeCronRequest(requestWith({ authorization: 'Bearer local-test-token' }), {
        NODE_ENV: 'test',
        WILMS_SCHEDULER_TOKEN: 'local-test-token',
      }),
    ).toBe(true);
  });
});
