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

export function buildUserInvitationEmail(input: {
  displayName: string;
  email: string;
  temporaryPassword: string;
  appUrl?: string;
}): { subject: string; text: string; html: string } {
  const loginUrl = input.appUrl?.trim() || 'https://wilms.vercel.app/login';
  const subject = 'You have been invited to WILMS';
  const text = [
    `Hello ${input.displayName},`,
    '',
    'Your WILMS account has been invited.',
    '',
    `Sign in: ${loginUrl}`,
    `Email: ${input.email}`,
    `Temporary password: ${input.temporaryPassword}`,
    '',
    'Please sign in and change your password immediately.',
    '',
    '— WILMS',
  ].join('\n');

  const html = [
    `<p>Hello <strong>${input.displayName}</strong>,</p>`,
    '<p>Your WILMS account has been invited.</p>',
    `<p><a href="${loginUrl}">Sign in to WILMS</a></p>`,
    `<p>Email: <strong>${input.email}</strong><br/>Temporary password: <strong>${input.temporaryPassword}</strong></p>`,
    '<p>Please sign in and change your password immediately.</p>',
    '<p>— WILMS</p>',
  ].join('');

  return { subject, text, html };
}

export function buildRegistrationRejectedEmail(input: {
  borrowerName: string;
  reason?: string;
}): { subject: string; text: string; html: string } {
  const subject = 'WILMS registration update';
  const reason = input.reason?.trim() || 'Please contact your registration officer for details.';
  const text = [
    `Dear ${input.borrowerName},`,
    '',
    'Your registration could not be approved at this time.',
    '',
    reason,
    '',
    '— WILMS',
  ].join('\n');

  const html = [
    `<p>Dear ${input.borrowerName},</p>`,
    '<p>Your registration could not be approved at this time.</p>',
    `<p>${reason}</p>`,
    '<p>— WILMS</p>',
  ].join('');

  return { subject, text, html };
}

export function buildRegistrationApprovedEmail(input: {
  borrowerName: string;
}): { subject: string; text: string; html: string } {
  const subject = 'WILMS registration approved';
  const text = [
    `Dear ${input.borrowerName},`,
    '',
    'Your registration has been approved. Your collector will contact you about next steps.',
    '',
    '— WILMS',
  ].join('\n');

  const html = [
    `<p>Dear ${input.borrowerName},</p>`,
    '<p>Your registration has been approved. Your collector will contact you about next steps.</p>',
    '<p>— WILMS</p>',
  ].join('');

  return { subject, text, html };
}

export function buildLoanRejectedSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Hi ${input.borrowerName}, your loan application was not approved. Contact your collector for details.`;
}

export function buildLoanDisbursedSmsBody(input: {
  borrowerName: string;
  loanDisplayId: string;
  amountPesewas: number;
}): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  return `WILMS: Hi ${input.borrowerName}, loan ${input.loanDisplayId} for GHS ${amountGhs} has been disbursed.`;
}

export function buildBlacklistSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Hi ${input.borrowerName}, your application has been flagged for review. Contact your registration officer.`;
}
