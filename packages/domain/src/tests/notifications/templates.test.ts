import { describe, expect, it } from 'vitest';
import {
  buildLoanApprovalEmail,
  buildLoanApprovalSmsBody,
  buildLoanDisbursedScheduleSmsBody,
  buildMissedPaymentSmsBody,
  buildBorrowerRegistrationApprovalSmsBody,
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSmsBody,
} from '../../infrastructure/notifications/templates.js';

describe('notification templates', () => {
  it('builds payment confirmation SMS with GHS amount and date', () => {
    expect(
      buildPaymentConfirmationSmsBody({
        amountPesewas: 12_500,
        paymentDate: '2026-06-20',
      }),
    ).toBe('WILMS: Payment of GHS 125.00 received on 2026-06-20. Thank you.');
  });

  it('builds payment confirmation SMS with balance and weeks remaining', () => {
    expect(
      buildPaymentConfirmationSmsBody({
        amountPesewas: 5_000,
        paymentDate: '2026-08-04',
        remainingBalancePesewas: 45_000,
        weeksRemaining: 9,
      }),
    ).toBe(
      'WILMS: Payment of GHS 50.00 received on 2026-08-04. Balance GHS 450.00. 9 weeks remaining.',
    );
  });

  it('builds loan approval SMS with borrower name and amount', () => {
    expect(
      buildLoanApprovalSmsBody({
        borrowerName: 'Ama Serwaa',
        amountPesewas: 50_000,
      }),
    ).toBe('WILMS: Hi Ama Serwaa, your interest-free loan of GHS 500.00 has been approved.');
  });

  it('builds missed payment SMS with overdue weeks and outstanding amount', () => {
    expect(
      buildMissedPaymentSmsBody({
        borrowerName: 'Kwame Osei',
        weeksOverdue: 2,
        amountPesewas: 15_000,
      }),
    ).toBe(
      'WILMS: Hi Kwame Osei, you have 2 missed payment(s). Outstanding: GHS 150.00. Please contact your collector.',
    );
  });

  it('builds missed payment SMS with due date, balance, and weeks remaining', () => {
    expect(
      buildMissedPaymentSmsBody({
        borrowerName: 'Ama Mensah',
        amountPesewas: 5_000,
        dueDate: '2026-08-04',
        remainingBalancePesewas: 40_000,
        weeksRemaining: 8,
      }),
    ).toBe(
      'WILMS: Hi Ama Mensah, your scheduled payment of GHS 50.00 was not recorded for 2026-08-04. Balance GHS 400.00. 8 weeks remaining. Please contact your collector.',
    );
  });

  it('builds disbursement schedule SMS with payment day and weeks', () => {
    expect(
      buildLoanDisbursedScheduleSmsBody({
        borrowerName: 'Efua Boateng',
        loanDisplayId: 'LOAN-001',
        weeklyAmountPesewas: 5_000,
        paymentDay: 'Tuesday',
        totalWeeks: 20,
        firstDueDate: '2026-08-11',
      }),
    ).toBe(
      'WILMS: Hi Efua Boateng, repay loan LOAN-001 every Tuesday: GHS 50.00 for 20 weeks. First due 2026-08-11.',
    );
  });

  it('builds borrower registration approval SMS', () => {
    expect(buildBorrowerRegistrationApprovalSmsBody({ borrowerName: 'Ama Serwaa' })).toContain(
      'Ama Serwaa',
    );
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
    expect(email.text).toContain('LOAN-CYCLE1-202605-0001');
    expect(email.html).toContain('GHS 50.00');
  });

  it('builds loan approval email subject and body', () => {
    const email = buildLoanApprovalEmail({
      borrowerName: 'Yaw Adom',
      amountPesewas: 24_000,
      loanDisplayId: 'LOAN-CYCLE4-202511-0002',
    });

    expect(email.subject).toBe('WILMS loan approved — LOAN-CYCLE4-202511-0002');
    expect(email.text).toContain('Yaw Adom');
    expect(email.text).toContain('GHS 240.00');
    expect(email.html).toContain('LOAN-CYCLE4-202511-0002');
  });
});
