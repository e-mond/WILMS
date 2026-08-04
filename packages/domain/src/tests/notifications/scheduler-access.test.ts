import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import {
  extractSchedulerToken,
  schedulerTokenMatches,
} from '../../middleware/require-scheduler-access.js';
import { DEDUPE, addDays } from '../../infrastructure/notifications/payment-notifications.js';

function mockReq(headers: Record<string, string>): Request {
  return {
    header: (name: string) => {
      const key = name.toLowerCase();
      return headers[key] ?? headers[name];
    },
  } as unknown as Request;
}

describe('scheduler token helpers', () => {
  it('matches tokens with timing-safe equality', () => {
    expect(schedulerTokenMatches('abc', 'abc')).toBe(true);
    expect(schedulerTokenMatches('abc', 'abd')).toBe(false);
    expect(schedulerTokenMatches('ab', 'abc')).toBe(false);
  });

  it('extracts Bearer and header tokens', () => {
    expect(
      extractSchedulerToken(mockReq({ authorization: 'Bearer cron-secret-value' })),
    ).toBe('cron-secret-value');
    expect(
      extractSchedulerToken(mockReq({ 'x-wilms-scheduler-token': 'header-secret' })),
    ).toBe('header-secret');
    expect(extractSchedulerToken(mockReq({}))).toBe('');
  });
});

describe('payment notification schedule edge rules', () => {
  it('uses distinct dedupe keys for due-soon vs missed vs confirmed', () => {
    expect(DEDUPE.paymentDueSoon('loan-a', '2026-05-16')).toBe(
      'payment-due-soon:loan-a:2026-05-16',
    );
    expect(DEDUPE.paymentMissed('loan-a', '2026-05-16')).toBe(
      'payment-missed:loan-a:2026-05-16',
    );
    expect(DEDUPE.paymentConfirmed('pay-1')).toBe('payment-confirmed:pay-1');
    expect(DEDUPE.paymentDueSoon('loan-a', '2026-05-16')).not.toBe(
      DEDUPE.paymentMissed('loan-a', '2026-05-16'),
    );
  });

  it('addDays supports one-day reminder lead across month boundaries', () => {
    expect(addDays('2026-05-15', 1)).toBe('2026-05-16');
    expect(addDays('2026-05-31', 1)).toBe('2026-06-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
