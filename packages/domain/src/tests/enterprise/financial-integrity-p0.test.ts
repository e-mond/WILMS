import { describe, expect, it } from 'vitest';
import { generateInvitePassword } from '../../lib/invite-password.js';
import { getPermissionsForRole, PERMISSION, USER_ROLE } from '@wilms/shared-rbac';
import { isVarianceFlagged } from '../../domain/reconciliation/variance.js';
import { validatePaymentSubmission } from '../../domain/payment/allocation.js';
import { sumRepaymentLedgerAmounts } from '../../domain/loan/mappers.js';

describe('enterprise financial integrity — P0 controls', () => {
  it('never reuses a fixed invite password', () => {
    const a = generateInvitePassword();
    const b = generateInvitePassword();
    expect(a).not.toBe('ChangeMe1!');
    expect(b).not.toBe('ChangeMe1!');
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(12);
    expect(/[A-Z]/.test(a)).toBe(true);
    expect(/[a-z]/.test(a)).toBe(true);
    expect(/[0-9]/.test(a)).toBe(true);
  });

  it('removes MANAGE_GROUPS from Collector SoD boundary', () => {
    const perms = getPermissionsForRole(USER_ROLE.COLLECTOR);
    expect(perms.has(PERMISSION.MANAGE_GROUPS)).toBe(false);
    expect(perms.has(PERMISSION.RECORD_COLLECTIONS)).toBe(true);
  });

  it('keeps Auditor read-only for admin portal / recon review gate', () => {
    const perms = getPermissionsForRole(USER_ROLE.AUDITOR);
    expect(perms.has(PERMISSION.ACCESS_ADMIN_PORTAL)).toBe(false);
    expect(perms.has(PERMISSION.VIEW_REPORTS)).toBe(true);
  });

  it('flags reconciliation when physical cash disagrees with system recorded', () => {
    expect(isVarianceFlagged(0, 10_000, 10, 500)).toBe(true);
    expect(isVarianceFlagged(0, 0, 10, 0)).toBe(false);
  });

  it('allows holiday-shifted due dates for collections', () => {
    const error = validatePaymentSubmission({
      amountPesewas: 5000,
      weeklyPaymentPesewas: 5000,
      paymentDay: 'Friday',
      referenceDate: '2026-06-06', // Saturday after Friday holiday shift
      scheduleWeeks: [
        {
          weekNumber: 1,
          dueDate: '2026-06-06',
          amountPesewas: 5000,
          status: 'PENDING',
        },
      ],
    });
    expect(error).toBeUndefined();
  });

  it('nets REVERSAL against REPAYMENT in progress totals', () => {
    const total = sumRepaymentLedgerAmounts([
      { entryType: 'REPAYMENT', amount: '50.00' },
      { entryType: 'REVERSAL', amount: '50.00' },
      { entryType: 'REPAYMENT', amount: '50.00' },
    ]);
    expect(total).toBe(5000);
  });
});
