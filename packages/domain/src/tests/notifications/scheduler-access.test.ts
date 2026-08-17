import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import {
  extractSchedulerToken,
  schedulerTokenMatches,
} from '../../middleware/require-scheduler-access.js';
import { DEDUPE, addDays, reminderLeadDays, toIsoDate, calendarDateInTimeZone, selectNextPendingWeek } from '../../infrastructure/notifications/payment-notifications.js';

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

  it('normalises timestamp-shaped due dates so T-1 matching still hits', () => {
    expect(toIsoDate('2026-08-18T00:00:00.000Z')).toBe('2026-08-18');
    expect(toIsoDate('2026-08-18')).toBe('2026-08-18');
    expect(toIsoDate(new Date('2026-08-18T00:00:00.000Z'))).toBe('2026-08-18');
    expect(addDays('2026-08-17T00:00:00.000Z', 1)).toBe('2026-08-18');
  });

  it('uses Africa/Accra calendar dates (Ghana, UTC+0)', () => {
    expect(calendarDateInTimeZone(new Date('2026-08-17T06:00:00.000Z'))).toBe('2026-08-17');
    expect(calendarDateInTimeZone(new Date('2026-08-17T23:30:00.000Z'))).toBe('2026-08-17');
  });

  it('treats invalid reminder lead as one day before', () => {
    expect(reminderLeadDays(undefined)).toBe(1);
    expect(reminderLeadDays(0)).toBe(1);
    expect(reminderLeadDays(-3)).toBe(1);
    expect(reminderLeadDays('not-a-number')).toBe(1);
    expect(reminderLeadDays('2')).toBe(2);
  });

  it('selects only the next payable pending week', () => {
    const next = selectNextPendingWeek([
      { status: 'PAID', dueDate: '2026-08-11' },
      { status: 'PENDING', dueDate: '2026-08-25T00:00:00.000Z' },
      { status: 'PENDING', dueDate: '2026-08-18' },
    ]);
    expect(toIsoDate(next?.dueDate ?? '')).toBe('2026-08-18');
  });
});
