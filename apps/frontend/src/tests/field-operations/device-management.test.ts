import { describe, expect, it } from 'vitest';
import { isAutoSyncEnabled, resolveOfflineSyncIntervalMs } from '@/lib/device/sync-policy';
import { buildReceiptText } from '@/lib/printing/receipt-print';

describe('sync policy', () => {
  it('falls back to default retry interval for invalid values', () => {
    expect(resolveOfflineSyncIntervalMs()).toBeGreaterThanOrEqual(30_000);
    expect(typeof isAutoSyncEnabled()).toBe('boolean');
  });
});

describe('receipt print', () => {
  it('builds thermal-friendly receipt text', () => {
    const text = buildReceiptText({
      title: 'WILMS Receipt',
      lines: ['Borrower: Ama Serwaa', 'Amount: GHS 50.00'],
    });
    expect(text).toContain('WILMS Receipt');
    expect(text).toContain('GHS 50.00');
  });
});
