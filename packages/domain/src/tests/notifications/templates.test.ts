import { describe, expect, it } from 'vitest';
import {
  buildLoanApprovalEmail,
  buildLoanApprovalSmsBody,
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
