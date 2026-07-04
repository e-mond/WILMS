export interface PaymentConfirmationSmsInput {
  amountPesewas: number;
  paymentDate: string;
}

export interface LoanApprovalSmsInput {
  borrowerName: string;
  amountPesewas: number;
}

export interface MissedPaymentSmsInput {
  borrowerName: string;
  weeksOverdue: number;
  amountPesewas: number;
}

export interface PaymentConfirmationEmailInput {
  borrowerName: string;
  amountPesewas: number;
  paymentDate: string;
  loanDisplayId: string;
}

export interface LoanApprovalEmailInput {
  borrowerName: string;
  amountPesewas: number;
  loanDisplayId: string;
}

export function formatGhsAmount(amountPesewas: number): string {
  return (amountPesewas / 100).toFixed(2);
}

export function buildPaymentConfirmationSmsBody(input: PaymentConfirmationSmsInput): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  return `WILMS: Payment of GHS ${amountGhs} received on ${input.paymentDate}. Thank you.`;
}

export function buildLoanApprovalSmsBody(input: LoanApprovalSmsInput): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  return `WILMS: Hi ${input.borrowerName}, your interest-free loan of GHS ${amountGhs} has been approved.`;
}

export function buildMissedPaymentSmsBody(input: MissedPaymentSmsInput): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  return `WILMS: Hi ${input.borrowerName}, you have ${input.weeksOverdue} missed payment(s). Outstanding: GHS ${amountGhs}. Please contact your collector.`;
}

export function buildBorrowerRegistrationApprovalSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Hi ${input.borrowerName}, your registration has been approved. Your collector will contact you about next steps.`;
}

export function buildPaymentConfirmationEmail(input: PaymentConfirmationEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const subject = `WILMS payment receipt — GHS ${amountGhs}`;
  const text = [
    `Dear ${input.borrowerName},`,
    '',
    `We received your payment of GHS ${amountGhs} on ${input.paymentDate} for loan ${input.loanDisplayId}.`,
    '',
    'Thank you for staying on track with your repayments.',
    '',
    '— WILMS',
  ].join('\n');

  const html = [
    `<p>Dear ${input.borrowerName},</p>`,
    `<p>We received your payment of <strong>GHS ${amountGhs}</strong> on ${input.paymentDate} for loan <strong>${input.loanDisplayId}</strong>.</p>`,
    '<p>Thank you for staying on track with your repayments.</p>',
    '<p>— WILMS</p>',
  ].join('');

  return { subject, text, html };
}

export function buildLoanApprovalEmail(input: LoanApprovalEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const subject = `WILMS loan approved — ${input.loanDisplayId}`;
  const text = [
    `Dear ${input.borrowerName},`,
    '',
    `Your interest-free loan application (${input.loanDisplayId}) for GHS ${amountGhs} has been approved.`,
    '',
    'Your collector will contact you about disbursement and weekly repayments.',
    '',
    '— WILMS',
  ].join('\n');

  const html = [
    `<p>Dear ${input.borrowerName},</p>`,
    `<p>Your interest-free loan application (<strong>${input.loanDisplayId}</strong>) for <strong>GHS ${amountGhs}</strong> has been approved.</p>`,
    '<p>Your collector will contact you about disbursement and weekly repayments.</p>',
    '<p>— WILMS</p>',
  ].join('');

  return { subject, text, html };
}
