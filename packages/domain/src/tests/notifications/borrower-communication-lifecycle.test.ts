import { describe, expect, it } from 'vitest';
import {
  buildAdminFeeConfirmationSmsBody,
  buildEscalationNoticeSmsBody,
  buildGracePeriodReminderSmsBody,
  buildLoanApprovalSmsBody,
  buildLoanCompletedSmsBody,
  buildLoanCreatedSmsBody,
  buildLoanDisbursedSmsBody,
  buildMissedPaymentSmsBody,
  buildBorrowerRegistrationApprovalSmsBody,
  buildRegistrationSubmittedSmsBody,
  buildLoanReminderSmsBody,
} from '../../infrastructure/notifications/templates.js';

/**
 * Sequence assertions for the authoritative borrower communication lifecycle.
 * These tests lock SMS wording and ordering expectations without inventing stages.
 */
describe('borrower communication lifecycle SMS sequence', () => {
  const borrowerName = 'Ama Mensah';

  it('follows registration → approval → loan created → loan approved (admin fee)', () => {
    const submitted = buildRegistrationSubmittedSmsBody({
      borrowerName,
      reference: 'BOR-100',
    });
    const approved = buildBorrowerRegistrationApprovalSmsBody({
      borrowerName,
      groupName: 'Makola Circle',
      collectorName: 'Kofi Boateng',
    });
    const created = buildLoanCreatedSmsBody({ borrowerName });
    const loanApproved = buildLoanApprovalSmsBody({
      borrowerName,
      amountPesewas: 100_000,
      adminFeePesewas: 5_000,
    });

    expect(submitted).toContain('received your loan registration');
    expect(approved).toContain('assigned to Makola Circle');
    expect(created).toContain('submitted for approval');
    expect(loanApproved).toContain('admin fee of GHS 50.00');
    expect(loanApproved).not.toContain('disbursed');
  });

  it('places admin-fee confirmation after approval and before disbursement copy', () => {
    const fee = buildAdminFeeConfirmationSmsBody({
      borrowerName,
      amountPesewas: 5_000,
      paymentDate: '2026-08-10',
    });
    const disbursed = buildLoanDisbursedSmsBody({
      borrowerName,
      loanDisplayId: 'LOAN-1',
      amountPesewas: 100_000,
      firstPaymentDate: '2026-08-18',
    });
    expect(fee).toContain('prepared for disbursement');
    expect(disbursed).toContain('successfully disbursed');
  });

  it('covers reminder → due today → missed → grace → escalation → completion', () => {
    expect(
      buildLoanReminderSmsBody({
        borrowerName,
        weeklyAmountPesewas: 5_000,
        paymentDay: 'Tuesday',
        paymentDate: '2026-08-18',
        groupName: 'Makola Circle',
        collectorName: 'Kofi',
        dueTomorrow: true,
      }),
    ).toContain('due tomorrow');
    expect(
      buildLoanReminderSmsBody({
        borrowerName,
        weeklyAmountPesewas: 5_000,
        paymentDate: '2026-08-18',
        collectorName: 'Kofi',
        dueTomorrow: false,
      }),
    ).toContain('due today');
    expect(
      buildMissedPaymentSmsBody({
        borrowerName,
        amountPesewas: 5_000,
        dueDate: '2026-08-18',
        collectorName: 'Kofi',
      }),
    ).toContain('grace period');
    expect(
      buildGracePeriodReminderSmsBody({
        borrowerName,
        weeklyAmountPesewas: 5_000,
        graceEndDate: '2026-08-21',
        collectorName: 'Kofi',
      }),
    ).toContain('grace period ends');
    expect(buildEscalationNoticeSmsBody({ collectorName: 'Kofi' })).toContain(
      'flagged for follow-up',
    );
    expect(
      buildLoanCompletedSmsBody({
        borrowerName,
        paymentAmountPesewas: 5_000,
      }),
    ).toContain('fully repaid');
  });
});
