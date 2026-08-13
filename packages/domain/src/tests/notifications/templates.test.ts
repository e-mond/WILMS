import { describe, expect, it } from 'vitest';
import {
  buildAdminFeeConfirmationSmsBody,
  buildCollectorReassignedSmsBody,
  buildEscalationNoticeSmsBody,
  buildGracePeriodReminderSmsBody,
  buildGroupAssignedSmsBody,
  buildLoanApprovalEmail,
  buildLoanApprovalSmsBody,
  buildLoanCompletedSmsBody,
  buildLoanCreatedSmsBody,
  buildLoanDisbursedScheduleSmsBody,
  buildLoanDisbursedSmsBody,
  buildMissedPaymentSmsBody,
  buildMultiWeekPaymentSmsBody,
  buildBorrowerRegistrationApprovalSmsBody,
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSmsBody,
  buildPaymentDayChangedSmsBody,
  buildLoanReminderSmsBody,
  buildRegistrationSubmittedSmsBody,
  buildBorrowerUpdateApprovedSmsBody,
  buildBorrowerUpdateRejectedSmsBody,
} from '../../infrastructure/notifications/templates.js';

describe('notification templates', () => {
  it('builds payment confirmation SMS with borrower name and balance', () => {
    expect(
      buildPaymentConfirmationSmsBody({
        borrowerName: 'Ama',
        amountPesewas: 12_500,
        paymentDate: '2026-06-20',
        remainingBalancePesewas: 37_500,
        weeksRemaining: 3,
      }),
    ).toBe(
      'WILMS: Thank you, Ama. We have received your payment of GHS 125.00 on 2026-06-20. Outstanding balance: GHS 375.00. Remaining instalments: 3. Thank you for staying up to date with your repayments.',
    );
  });

  it('builds multi-week payment SMS', () => {
    expect(
      buildMultiWeekPaymentSmsBody({
        borrowerName: 'Kwame',
        amountPesewas: 10_000,
        weeksPaid: 2,
        remainingBalancePesewas: 40_000,
        weeksRemaining: 8,
      }),
    ).toContain('covering 2 weekly repayments');
  });

  it('builds loan approval SMS with admin fee instruction', () => {
    expect(
      buildLoanApprovalSmsBody({
        borrowerName: 'Ama Serwaa',
        amountPesewas: 50_000,
        adminFeePesewas: 5_000,
      }),
    ).toContain('admin fee of GHS 50.00');
  });

  it('builds missed payment SMS for due date', () => {
    expect(
      buildMissedPaymentSmsBody({
        borrowerName: 'Ama Mensah',
        amountPesewas: 5_000,
        dueDate: '2026-08-04',
        collectorName: 'Kofi Boateng',
      }),
    ).toContain('due today (2026-08-04)');
  });

  it('builds grace and escalation SMS', () => {
    expect(
      buildGracePeriodReminderSmsBody({
        borrowerName: 'Ama',
        weeklyAmountPesewas: 5_000,
        graceEndDate: '2026-08-07',
        collectorName: 'Kofi',
      }),
    ).toContain('grace period ends on 2026-08-07');
    expect(buildEscalationNoticeSmsBody({ collectorName: 'Kofi' })).toContain(
      'flagged for follow-up',
    );
  });

  it('builds disbursement and schedule SMS', () => {
    expect(
      buildLoanDisbursedSmsBody({
        borrowerName: 'Efua Boateng',
        loanDisplayId: 'LOAN-001',
        amountPesewas: 100_000,
        firstPaymentDate: '2026-08-11',
      }),
    ).toContain('successfully disbursed');
    expect(
      buildLoanDisbursedScheduleSmsBody({
        borrowerName: 'Efua Boateng',
        loanDisplayId: 'LOAN-001',
        groupName: 'Makola Circle',
        collectorName: 'Ama Collector',
        weeklyAmountPesewas: 5_000,
        paymentDay: 'Tuesday',
        totalWeeks: 20,
        firstDueDate: '2026-08-11',
      }),
    ).toContain('Repayment Schedule');
  });

  it('builds registration and loan-created SMS', () => {
    expect(
      buildRegistrationSubmittedSmsBody({
        borrowerName: 'Ama Serwaa',
        reference: 'BOR-001',
      }),
    ).toContain('application reference is BOR-001');
    expect(
      buildBorrowerRegistrationApprovalSmsBody({
        borrowerName: 'Ama Serwaa',
        groupName: 'Circle A',
        collectorName: 'Kofi Mensah',
      }),
    ).toContain('assigned to Circle A under Collector Kofi Mensah');
    expect(buildLoanCreatedSmsBody({ borrowerName: 'Ama' })).toContain(
      'created and submitted for approval',
    );
  });

  it('builds completion and reassignment SMS', () => {
    expect(
      buildLoanCompletedSmsBody({
        borrowerName: 'Ama',
        paymentAmountPesewas: 5_000,
      }),
    ).toContain('fully repaid');
    expect(
      buildCollectorReassignedSmsBody({
        borrowerName: 'Ama',
        collectorName: 'New Collector',
      }),
    ).toContain('new collector is New Collector');
    expect(
      buildGroupAssignedSmsBody({
        borrowerName: 'Ama',
        groupName: 'Group B',
        collectorName: 'Collector B',
      }),
    ).toContain('reassigned to Group B');
    expect(
      buildPaymentDayChangedSmsBody({
        paymentDay: 'Friday',
        weeklyAmountPesewas: 5_000,
        nextPaymentDate: '2026-08-15',
      }),
    ).toContain('new weekly payment day is Friday');
  });

  it('builds admin fee confirmation SMS after loan approval', () => {
    expect(
      buildAdminFeeConfirmationSmsBody({
        borrowerName: 'Ama',
        amountPesewas: 5_000,
        paymentDate: '2026-08-10',
      }),
    ).toContain('prepared for disbursement');
  });

  it('builds reminder SMS for tomorrow and today', () => {
    expect(
      buildLoanReminderSmsBody({
        borrowerName: 'Ama',
        weeklyAmountPesewas: 5_000,
        paymentDay: 'Tuesday',
        paymentDate: '2026-05-16',
        groupName: 'Circle A',
        collectorName: 'Kofi',
        dueTomorrow: true,
      }),
    ).toContain('due tomorrow');
    expect(
      buildLoanReminderSmsBody({
        borrowerName: 'Ama',
        weeklyAmountPesewas: 5_000,
        paymentDate: '2026-05-16',
        collectorName: 'Kofi',
        dueTomorrow: false,
      }),
    ).toContain('due today');
  });

  it('builds payment confirmation email subject and body', () => {
    const email = buildPaymentConfirmationEmail({
      borrowerName: 'Efua Boateng',
      amountPesewas: 5_000,
      paymentDate: '2026-06-20',
      loanDisplayId: 'LOAN-CYCLE1-202605-0001',
    });

    expect(email.subject).toBe('WILMS payment receipt — GHS 50.00');
    expect(email.text).toContain('Efua Boateng');
    expect(email.html).toContain('GHS 50.00');
  });

  it('builds loan approval email with admin fee', () => {
    const email = buildLoanApprovalEmail({
      borrowerName: 'Yaw Adom',
      amountPesewas: 24_000,
      loanDisplayId: 'LOAN-CYCLE4-202511-0002',
      adminFeePesewas: 5_000,
    });

    expect(email.subject).toBe('WILMS loan approved — LOAN-CYCLE4-202511-0002');
    expect(email.text).toContain('admin fee of GHS 50.00');
  });

  it('builds borrower update decision SMS', () => {
    expect(
      buildBorrowerUpdateApprovedSmsBody({
        borrowerName: 'Gloria',
        field: 'PHONE',
        afterValue: '0244444444',
      }),
    ).toContain('has been updated to 0244444444');
    expect(
      buildBorrowerUpdateRejectedSmsBody({
        borrowerName: 'Gloria',
        field: 'PHONE',
        reviewNote: 'Could not verify',
      }),
    ).toContain('not approved');
  });
});
