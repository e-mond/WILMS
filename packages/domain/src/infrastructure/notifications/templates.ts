import {
  buildEmailTemplate,
  emailAlert,
  emailButton,
  emailCard,
  emailDivider,
  emailOtpCode,
  emailParagraph,
  emailReceipt,
  emailSecondaryButton,
  emailStatusBanner,
  emailSummary,
  type EmailTemplate,
} from './email-layout.js';

export interface PaymentConfirmationSmsInput {
  borrowerName?: string;
  amountPesewas: number;
  paymentDate: string;
  remainingBalancePesewas?: number;
  weeksRemaining?: number;
}

export interface MultiWeekPaymentSmsInput {
  borrowerName: string;
  amountPesewas: number;
  weeksPaid: number;
  remainingBalancePesewas?: number;
  weeksRemaining?: number;
}

export interface LoanApprovalSmsInput {
  borrowerName: string;
  amountPesewas: number;
  adminFeePesewas: number;
}

export interface MissedPaymentSmsInput {
  borrowerName: string;
  amountPesewas: number;
  /** Expected collection date (ISO yyyy-mm-dd). */
  dueDate?: string;
  /** Legacy aggregate count when dueDate is unavailable. */
  weeksOverdue?: number;
  remainingBalancePesewas?: number;
  weeksRemaining?: number;
  collectorName?: string;
}

export interface LoanDisbursedScheduleSmsInput {
  borrowerName?: string;
  loanDisplayId?: string;
  groupName: string;
  collectorName: string;
  weeklyAmountPesewas: number;
  paymentDay: string;
  totalWeeks: number;
  firstDueDate: string;
}

export interface PaymentReminderSmsInput {
  borrowerName: string;
  weeklyAmountPesewas?: number;
  amountPesewas?: number;
  paymentDay?: string;
  paymentDate?: string;
  dueDate?: string;
  loanDisplayId?: string;
  groupName?: string;
  collectorName?: string;
  dueTomorrow?: boolean;
}

export interface PaymentConfirmationEmailInput {
  borrowerName: string;
  amountPesewas: number;
  paymentDate: string;
  loanDisplayId: string;
  outstandingBalancePesewas?: number;
}

export interface LoanApprovalEmailInput {
  borrowerName: string;
  amountPesewas: number;
  loanDisplayId: string;
  adminFeePesewas?: number;
}

export function formatGhsAmount(amountPesewas: number): string {
  return (amountPesewas / 100).toFixed(2);
}

// ─── SMS templates ───────────────────────────────────────────────────────────

export function buildPaymentConfirmationSmsBody(input: PaymentConfirmationSmsInput): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const name = input.borrowerName?.trim() || 'borrower';
  const balance =
    typeof input.remainingBalancePesewas === 'number'
      ? formatGhsAmount(input.remainingBalancePesewas)
      : '0.00';
  const weeks = typeof input.weeksRemaining === 'number' ? String(input.weeksRemaining) : '0';
  return `WILMS: Thank you, ${name}. We have received your payment of GHS ${amountGhs} on ${input.paymentDate}. Outstanding balance: GHS ${balance}. Remaining instalments: ${weeks}. Thank you for staying up to date with your repayments.`;
}

export function buildMultiWeekPaymentSmsBody(input: MultiWeekPaymentSmsInput): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const balance =
    typeof input.remainingBalancePesewas === 'number'
      ? formatGhsAmount(input.remainingBalancePesewas)
      : '0.00';
  const weeks = typeof input.weeksRemaining === 'number' ? String(input.weeksRemaining) : '0';
  return `WILMS: Thank you, ${input.borrowerName}. We have received GHS ${amountGhs}, covering ${input.weeksPaid} weekly repayments. Outstanding balance: GHS ${balance}. Remaining instalments: ${weeks}.`;
}

export function buildLoanApprovalSmsBody(input: LoanApprovalSmsInput): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const feeGhs = formatGhsAmount(input.adminFeePesewas);
  return `WILMS: Congratulations ${input.borrowerName}! Your interest-free loan of GHS ${amountGhs} has been approved. To proceed to disbursement, please pay the required admin fee of GHS ${feeGhs}. We will notify you immediately after your payment is confirmed.`;
}

export function buildMissedPaymentSmsBody(input: MissedPaymentSmsInput): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const collector = input.collectorName?.trim() || 'your collector';
  if (input.dueDate) {
    return `WILMS: Dear ${input.borrowerName}, we did not receive your repayment of GHS ${amountGhs} due today (${input.dueDate}). Please make payment within the grace period to avoid escalation. If you have already paid, please contact your collector, ${collector}.`;
  }
  const weeks = input.weeksOverdue ?? 1;
  return `WILMS: Dear ${input.borrowerName}, we did not receive your repayment of GHS ${amountGhs} (${weeks} missed instalment(s)). Please make payment within the grace period to avoid escalation. If you have already paid, please contact your collector, ${collector}.`;
}

export function buildGracePeriodReminderSmsBody(input: {
  borrowerName: string;
  weeklyAmountPesewas: number;
  graceEndDate: string;
  collectorName?: string;
}): string {
  const amountGhs = formatGhsAmount(input.weeklyAmountPesewas);
  const collector = input.collectorName?.trim() || 'your collector';
  return `WILMS: Reminder — Your repayment of GHS ${amountGhs} remains outstanding. Your grace period ends on ${input.graceEndDate}. Please make payment immediately or contact your collector, ${collector}, if you need assistance.`;
}

export function buildEscalationNoticeSmsBody(input: { collectorName?: string }): string {
  const collector = input.collectorName?.trim() || 'your collector';
  return `WILMS: Your repayment remains unpaid after the grace period. Your account has been flagged for follow-up by your group and collector. Please contact ${collector} immediately to avoid further action.`;
}

export function buildLoanDisbursedScheduleSmsBody(input: LoanDisbursedScheduleSmsInput): string {
  const weeklyGhs = formatGhsAmount(input.weeklyAmountPesewas);
  return `WILMS: Repayment Schedule — Group: ${input.groupName} | Collector: ${input.collectorName} | Weekly payment: GHS ${weeklyGhs} | Payment day: ${input.paymentDay} | First payment: ${input.firstDueDate} | Total weeks: ${input.totalWeeks}. Please make each payment on or before the due date.`;
}

export function buildBorrowerRegistrationApprovalSmsBody(input: {
  borrowerName: string;
  groupName?: string;
  collectorName?: string;
  nextStep?: string;
}): string {
  if (input.groupName?.trim() && input.collectorName?.trim()) {
    return `WILMS: Congratulations ${input.borrowerName}! Your registration has been approved. You have been assigned to ${input.groupName} under Collector ${input.collectorName}. The next step is the creation and approval of your interest-free loan.`;
  }
  return `WILMS: Congratulations ${input.borrowerName}! Your registration has been approved. The next step is the creation and approval of your interest-free loan.`;
}

export function buildRegistrationSubmittedSmsBody(input: {
  borrowerName: string;
  reference?: string;
}): string {
  const reference = input.reference?.trim() || 'pending';
  return `WILMS: Dear ${input.borrowerName}, we have received your loan registration application. Your application reference is ${reference}. An Approver will review it shortly. We will notify you once a decision has been made.`;
}

export function buildLoanCreatedSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Dear ${input.borrowerName}, your loan application has been created and submitted for approval. We will notify you once the loan has been approved.`;
}

export function buildGroupAssignedSmsBody(input: {
  borrowerName: string;
  groupName: string;
  collectorName?: string;
}): string {
  const collector = input.collectorName?.trim() || 'your collector';
  return `WILMS: Dear ${input.borrowerName}, you have been reassigned to ${input.groupName} under Collector ${collector}. Your future repayments should be made through your new group and collector.`;
}

export function buildCollectorReassignedSmsBody(input: {
  borrowerName: string;
  collectorName: string;
}): string {
  return `WILMS: Dear ${input.borrowerName}, your collector has been updated. Your new collector is ${input.collectorName}. Your group and repayment schedule remain unchanged unless separately notified.`;
}

export function buildAdminFeeConfirmationSmsBody(input: {
  borrowerName?: string;
  amountPesewas: number;
  loanDisplayId?: string;
  paymentDate: string;
}): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const name = input.borrowerName?.trim() || 'borrower';
  return `WILMS: Dear ${name}, we have received your admin fee payment of GHS ${amountGhs} on ${input.paymentDate}. Your loan is now being prepared for disbursement. We will notify you once the funds have been released.`;
}

export function buildRegistrationRejectedSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Dear ${input.borrowerName}, your loan registration application was not approved. Please contact your registration officer if you would like further guidance.`;
}

export function buildLoanRejectedSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Hi ${input.borrowerName}, your loan application was not approved. Contact your collector for details.`;
}

export function buildLoanDisbursedSmsBody(input: {
  borrowerName: string;
  loanDisplayId: string;
  amountPesewas: number;
  firstPaymentDate: string;
}): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  return `WILMS: Dear ${input.borrowerName}, your interest-free loan of GHS ${amountGhs} has been successfully disbursed. Your first repayment is due on ${input.firstPaymentDate}. A detailed repayment schedule has been sent to you.`;
}

export function buildLoanCompletedSmsBody(input: {
  borrowerName: string;
  paymentAmountPesewas: number;
}): string {
  const amountGhs = formatGhsAmount(input.paymentAmountPesewas);
  return `WILMS: Congratulations ${input.borrowerName}! We have received your final repayment of GHS ${amountGhs}. Your loan has been fully repaid and your account is now closed. Thank you for honouring your repayment commitments.`;
}

export function buildBlacklistSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Dear ${input.borrowerName}, your registration application cannot proceed at this time. Please contact the WILMS office for assistance.`;
}

export function buildRegistrationEscalatedSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Dear ${input.borrowerName}, your registration application requires additional review. We will notify you once a decision has been made.`;
}

export function buildGuarantorLoanApprovedSmsBody(input: {
  guarantorName: string;
  borrowerName: string;
}): string {
  return `WILMS: Dear ${input.guarantorName}, the loan application of ${input.borrowerName}, whom you guaranteed, has been approved. As guarantor, you may be contacted if repayment obligations are not met.`;
}

export function buildGuarantorLoanFullyRepaidSmsBody(input: {
  guarantorName: string;
  borrowerName: string;
}): string {
  return `WILMS: Dear ${input.guarantorName}, ${input.borrowerName} has successfully completed repayment of the loan you guaranteed. Your guarantee obligation has now ended.`;
}

export function buildGuarantorMissedPaymentsSmsBody(input: {
  guarantorName: string;
  borrowerName: string;
}): string {
  return `WILMS: Dear ${input.guarantorName}, ${input.borrowerName} has missed multiple scheduled repayments. Please encourage the borrower to contact their collector and regularise the account.`;
}

export function buildLoanReminderSmsBody(input: PaymentReminderSmsInput): string {
  const weekly = input.weeklyAmountPesewas ?? input.amountPesewas ?? 0;
  const amountGhs = formatGhsAmount(weekly);
  const paymentDate = input.paymentDate || input.dueDate || '';
  const collector = input.collectorName?.trim() || 'your collector';
  if (input.dueTomorrow) {
    const group = input.groupName?.trim() || 'your group';
    const day = input.paymentDay || 'your payment day';
    return `WILMS: Reminder — Dear ${input.borrowerName}, your weekly repayment of GHS ${amountGhs} is due tomorrow (${day}, ${paymentDate}). Group: ${group}. Collector: ${collector}. Please ensure payment is made on time.`;
  }
  return `WILMS: Dear ${input.borrowerName}, your repayment of GHS ${amountGhs} is due today (${paymentDate}). Please make payment to your collector, ${collector}, today to keep your account in good standing.`;
}

export function buildPaymentDayChangedSmsBody(input: {
  paymentDay: string;
  weeklyAmountPesewas: number;
  nextPaymentDate: string;
}): string {
  const amountGhs = formatGhsAmount(input.weeklyAmountPesewas);
  return `WILMS: Important — Your repayment schedule has changed. Your new weekly payment day is ${input.paymentDay}. Your next payment of GHS ${amountGhs} is due on ${input.nextPaymentDate}.`;
}

export function buildBorrowerUpdateApprovedSmsBody(input: {
  borrowerName: string;
  field: string;
  afterValue: string;
}): string {
  return `WILMS: Dear ${input.borrowerName}, your ${input.field.toLowerCase().replace(/_/g, ' ')} has been updated to ${input.afterValue}. Contact your collector if this is unexpected.`;
}

export function buildBorrowerUpdateRejectedSmsBody(input: {
  borrowerName: string;
  field: string;
  reviewNote?: string | null;
}): string {
  const note = input.reviewNote?.trim();
  const fieldLabel = input.field.toLowerCase().replace(/_/g, ' ');
  return note
    ? `WILMS: Dear ${input.borrowerName}, the requested ${fieldLabel} update was not approved. ${note}`
    : `WILMS: Dear ${input.borrowerName}, the requested ${fieldLabel} update was not approved. Your collector can submit a corrected request.`;
}

export function buildCollectionReminderSmsBody(input: {
  borrowerName: string;
  amountPesewas: number;
  collectorName: string;
}): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  return `WILMS: Hi ${input.borrowerName}, your collector ${input.collectorName} will collect GHS ${amountGhs} this week.`;
}

// ─── Email templates (branded) ───────────────────────────────────────────────

export function buildPaymentConfirmationEmail(input: PaymentConfirmationEmailInput): EmailTemplate {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const outstanding = input.outstandingBalancePesewas
    ? formatGhsAmount(input.outstandingBalancePesewas)
    : null;

  return buildEmailTemplate({
    subject: `WILMS payment receipt — GHS ${amountGhs}`,
    greeting: input.borrowerName,
    preheader: `Payment of GHS ${amountGhs} received for loan ${input.loanDisplayId}`,
    theme: 'success',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `We received your payment of GHS ${amountGhs} on ${input.paymentDate} for loan ${input.loanDisplayId}.`,
      outstanding ? `Outstanding balance: GHS ${outstanding}` : '',
      '',
      'Thank you for staying on track with your repayments.',
      '',
      '— WILMS',
    ].filter(Boolean),
    htmlBody: [
      emailParagraph('We received your payment. Thank you for staying on track with your repayments.'),
      emailReceipt([
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Amount Paid', value: `GHS ${amountGhs}` },
        { label: 'Payment Date', value: input.paymentDate },
        ...(outstanding ? [{ label: 'Outstanding Balance', value: `GHS ${outstanding}` }] : []),
      ]),
      emailButton('View Loan', `https://wilms.vercel.app/loans`),
    ].join(''),
  });
}

export function buildLoanApprovalEmail(input: LoanApprovalEmailInput): EmailTemplate {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const feeGhs =
    typeof input.adminFeePesewas === 'number' ? formatGhsAmount(input.adminFeePesewas) : null;

  return buildEmailTemplate({
    subject: `WILMS loan approved — ${input.loanDisplayId}`,
    greeting: input.borrowerName,
    preheader: `Your loan ${input.loanDisplayId} for GHS ${amountGhs} has been approved`,
    theme: 'success',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your interest-free loan application (${input.loanDisplayId}) for GHS ${amountGhs} has been approved.`,
      feeGhs
        ? `To proceed to disbursement, please pay the required admin fee of GHS ${feeGhs}. We will notify you immediately after your payment is confirmed.`
        : 'Your collector will contact you about the next steps for disbursement.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your loan application has been approved!', 'success'),
      emailCard('Loan Details', [
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Approved Amount', value: `GHS ${amountGhs}` },
        ...(feeGhs ? [{ label: 'Admin fee due', value: `GHS ${feeGhs}` }] : []),
      ]),
      emailParagraph(
        feeGhs
          ? `To proceed to disbursement, please pay the required admin fee of GHS ${feeGhs}.`
          : 'Your collector will contact you about the next steps for disbursement.',
      ),
      emailButton('View Loan', `https://wilms.vercel.app/loans`),
    ].join(''),
  });
}

export function buildUserInvitationEmail(input: {
  displayName: string;
  email: string;
  temporaryPassword: string;
  /** One-time signed accept token (raw). Required for secure accept links. */
  invitationToken?: string;
  appUrl?: string;
  expiresAt?: Date;
}): EmailTemplate {
  const baseUrl = input.appUrl?.trim() || 'https://wilms.vercel.app';
  const acceptParams = new URLSearchParams({ email: input.email });
  if (input.invitationToken) {
    acceptParams.set('token', input.invitationToken);
  }
  const acceptUrl = `${baseUrl.replace(/\/$/, '')}/accept-invitation?${acceptParams.toString()}`;
  const expiryLabel = input.expiresAt
    ? input.expiresAt.toISOString().slice(0, 10)
    : '7 days from invite';

  return buildEmailTemplate({
    subject: 'You have been invited to WILMS',
    greeting: input.displayName,
    preheader: 'Your WILMS account has been created. Sign in to get started.',
    theme: 'info',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      'Your WILMS account has been invited.',
      `Accept invitation: ${acceptUrl}`,
      `Email: ${input.email}`,
      `Temporary password: ${input.temporaryPassword}`,
      `Invitation expires: ${expiryLabel}`,
      '',
      'Open the Accept Invitation link once, then sign in and change your password.',
      '',
      'Need help? Contact your WILMS administrator or support@wilms.org',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph('Your WILMS account has been created. Use the credentials below to sign in.'),
      emailCard('Account Details', [
        { label: 'Email', value: input.email },
        { label: 'Temporary Password', value: input.temporaryPassword },
        { label: 'Invitation Expires', value: expiryLabel },
      ]),
      emailAlert('Please change your password immediately after signing in.', 'warning'),
      emailButton('Accept Invitation', acceptUrl, 'primary'),
      emailParagraph('Need help? Contact your WILMS administrator or support@wilms.org'),
    ].join(''),
  });
}

export function buildInvitationReminderEmail(input: {
  displayName: string;
  email: string;
  appUrl?: string;
}): EmailTemplate {
  const loginUrl = input.appUrl?.trim() || 'https://wilms.vercel.app/login';

  return buildEmailTemplate({
    subject: 'Reminder: Complete your WILMS account setup',
    greeting: input.displayName,
    preheader: 'Your WILMS invitation is still pending',
    theme: 'warning',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      'This is a reminder that your WILMS account invitation is still pending.',
      `Sign in: ${loginUrl}`,
      `Email: ${input.email}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your WILMS account invitation is still pending.', 'warning'),
      emailParagraph('Please sign in to complete your account setup.'),
      emailButton('Complete Setup', loginUrl, 'primary'),
    ].join(''),
  });
}

export function buildRegistrationRejectedEmail(input: {
  borrowerName: string;
  reason?: string;
}): EmailTemplate {
  const reason = input.reason?.trim() || 'Please contact your registration officer for details.';

  return buildEmailTemplate({
    subject: 'WILMS registration update',
    greeting: input.borrowerName,
    preheader: 'Your registration requires attention',
    theme: 'warning',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      'Your registration could not be approved at this time.',
      reason,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your registration could not be approved at this time.', 'warning'),
      emailParagraph(reason),
    ].join(''),
  });
}

export function buildRegistrationApprovedEmail(input: {
  borrowerName: string;
  groupName?: string;
  collectorName?: string;
  nextStep?: string;
}): EmailTemplate {
  const nextStep =
    input.nextStep?.trim() ||
    'Next step: pay the admin fee so your loan application can proceed.';
  const details = [
    input.groupName ? `Group: ${input.groupName}` : null,
    input.collectorName ? `Collector: ${input.collectorName}` : null,
    nextStep,
  ].filter(Boolean) as string[];

  return buildEmailTemplate({
    subject: 'WILMS registration approved',
    greeting: input.borrowerName,
    preheader: 'Your registration has been approved',
    theme: 'success',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      'Your registration has been approved.',
      ...details,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Congratulations! Your registration has been approved.', 'success'),
      emailSummary('What happens next', details),
      emailButton('Complete Registration', 'https://wilms.vercel.app/login', 'success'),
    ].join(''),
  });
}

export function buildRegistrationSubmittedEmail(input: { borrowerName: string }): EmailTemplate {
  return buildEmailTemplate({
    subject: 'WILMS registration received',
    greeting: input.borrowerName,
    preheader: 'We have received your registration',
    theme: 'info',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      'Thank you. We have received your WILMS registration and an approver will review it shortly.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your registration has been submitted for review.', 'info'),
      emailParagraph('An approver will review your application shortly.'),
    ].join(''),
  });
}

export function buildWelcomeEmail(input: {
  displayName: string;
  role: string;
  appUrl?: string;
}): EmailTemplate {
  const loginUrl = input.appUrl?.trim() || 'https://wilms.vercel.app/login';

  return buildEmailTemplate({
    subject: 'Welcome to WILMS',
    greeting: input.displayName,
    preheader: 'Welcome to the WILMS platform',
    theme: 'success',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      `Welcome to WILMS! Your account is now active as ${input.role}.`,
      `Sign in: ${loginUrl}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph(`Welcome to WILMS! Your account is now active as <strong>${input.role}</strong>.`),
      emailSummary('Getting Started', [
        'Sign in to your account',
        'Complete your profile settings',
        'Explore your dashboard',
      ]),
      emailButton('Login', loginUrl, 'success'),
    ].join(''),
  });
}

export function buildPasswordResetEmail(input: {
  displayName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}): EmailTemplate {
  const expiry = input.expiresInMinutes ?? 60;

  return buildEmailTemplate({
    subject: 'Reset your WILMS password',
    greeting: input.displayName,
    preheader: 'Password reset request for your WILMS account',
    theme: 'info',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      'We received a request to reset your WILMS password.',
      `Reset link: ${input.resetUrl}`,
      `This link expires in ${expiry} minutes.`,
      '',
      'If you did not request this, please ignore this email.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph('We received a request to reset your WILMS password.'),
      emailButton('Reset Password', input.resetUrl, 'info'),
      emailAlert(`This link expires in ${expiry} minutes. If you did not request this, please ignore this email.`, 'warning'),
    ].join(''),
  });
}

export function buildAccountActivatedEmail(input: {
  displayName: string;
  appUrl?: string;
}): EmailTemplate {
  const loginUrl = input.appUrl?.trim() || 'https://wilms.vercel.app/login';

  return buildEmailTemplate({
    subject: 'Your WILMS account has been activated',
    greeting: input.displayName,
    preheader: 'Your account is now active',
    theme: 'success',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      'Your WILMS account has been activated. You can now sign in.',
      `Sign in: ${loginUrl}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your account has been activated.', 'success'),
      emailButton('Login', loginUrl, 'success'),
    ].join(''),
  });
}

export function buildAccountDisabledEmail(input: {
  displayName: string;
  reason?: string;
}): EmailTemplate {
  const reason = input.reason?.trim() || 'Please contact your administrator for more information.';

  return buildEmailTemplate({
    subject: 'Your WILMS account has been disabled',
    greeting: input.displayName,
    preheader: 'Your account access has been suspended',
    theme: 'critical',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      'Your WILMS account has been disabled.',
      reason,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your account has been disabled.', 'critical'),
      emailParagraph(reason),
    ].join(''),
  });
}

export function buildAccountEnabledEmail(input: {
  displayName: string;
  appUrl?: string;
}): EmailTemplate {
  const loginUrl = input.appUrl?.trim() || 'https://wilms.vercel.app/login';

  return buildEmailTemplate({
    subject: 'Your WILMS account has been re-enabled',
    greeting: input.displayName,
    preheader: 'Your account access has been restored',
    theme: 'success',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      'Your WILMS account has been re-enabled. You can sign in again.',
      `Sign in: ${loginUrl}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your account access has been restored.', 'success'),
      emailButton('Login', loginUrl, 'success'),
    ].join(''),
  });
}

export function buildLoanRejectedEmail(input: {
  borrowerName: string;
  loanDisplayId: string;
  reason?: string;
}): EmailTemplate {
  const reason = input.reason?.trim() || 'Please contact your collector for more information.';

  return buildEmailTemplate({
    subject: `WILMS loan update — ${input.loanDisplayId}`,
    greeting: input.borrowerName,
    preheader: `Update on loan ${input.loanDisplayId}`,
    theme: 'critical',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your loan application (${input.loanDisplayId}) was not approved.`,
      reason,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert(`Loan ${input.loanDisplayId} was not approved.`, 'critical'),
      emailCard('Loan Details', [{ label: 'Loan ID', value: input.loanDisplayId }]),
      emailParagraph(reason),
    ].join(''),
  });
}

export function buildLoanClosedEmail(input: {
  borrowerName: string;
  loanDisplayId: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: `WILMS loan closed — ${input.loanDisplayId}`,
    greeting: input.borrowerName,
    preheader: `Loan ${input.loanDisplayId} has been closed`,
    theme: 'info',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your loan ${input.loanDisplayId} has been closed.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph(`Your loan <strong>${input.loanDisplayId}</strong> has been closed.`),
      emailButton('View Loan History', 'https://wilms.vercel.app/loans', 'info'),
    ].join(''),
  });
}

export function buildLoanFullyPaidEmail(input: {
  borrowerName: string;
  loanDisplayId: string;
  totalPaidPesewas: number;
}): EmailTemplate {
  const totalGhs = formatGhsAmount(input.totalPaidPesewas);

  return buildEmailTemplate({
    subject: `Congratulations! Loan ${input.loanDisplayId} fully paid`,
    greeting: input.borrowerName,
    preheader: `You have fully repaid loan ${input.loanDisplayId}`,
    theme: 'success',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Congratulations! You have fully repaid loan ${input.loanDisplayId}.`,
      `Total repaid: GHS ${totalGhs}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Congratulations! Your loan has been fully repaid.', 'success'),
      emailCard('Loan Summary', [
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Total Repaid', value: `GHS ${totalGhs}` },
        { label: 'Status', value: 'Fully Paid' },
      ]),
      emailButton('Download Receipt', 'https://wilms.vercel.app/loans', 'success'),
    ].join(''),
  });
}

export function buildPaymentReversalEmail(input: {
  borrowerName: string;
  amountPesewas: number;
  loanDisplayId: string;
  reason: string;
  reversalDate: string;
}): EmailTemplate {
  const amountGhs = formatGhsAmount(input.amountPesewas);

  return buildEmailTemplate({
    subject: `WILMS payment reversal — GHS ${amountGhs}`,
    greeting: input.borrowerName,
    preheader: `Payment of GHS ${amountGhs} has been reversed`,
    theme: 'warning',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `A payment of GHS ${amountGhs} for loan ${input.loanDisplayId} has been reversed on ${input.reversalDate}.`,
      `Reason: ${input.reason}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('A payment has been reversed on your account.', 'warning'),
      emailCard('Reversal Details', [
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Amount', value: `GHS ${amountGhs}` },
        { label: 'Date', value: input.reversalDate },
        { label: 'Reason', value: input.reason },
      ]),
    ].join(''),
  });
}

export function buildLoanDefaultEmail(input: {
  borrowerName: string;
  loanDisplayId: string;
  outstandingPesewas: number;
  weeksOverdue: number;
}): EmailTemplate {
  const amountGhs = formatGhsAmount(input.outstandingPesewas);

  return buildEmailTemplate({
    subject: `WILMS loan default notice — ${input.loanDisplayId}`,
    greeting: input.borrowerName,
    preheader: `Important notice regarding loan ${input.loanDisplayId}`,
    theme: 'critical',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your loan ${input.loanDisplayId} is in default. Outstanding: GHS ${amountGhs}. Weeks overdue: ${input.weeksOverdue}.`,
      'Please contact your collector immediately.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your loan is in default. Please contact your collector immediately.', 'critical'),
      emailCard('Default Details', [
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Outstanding', value: `GHS ${amountGhs}` },
        { label: 'Weeks Overdue', value: String(input.weeksOverdue) },
      ]),
    ].join(''),
  });
}

export function buildLoanReminderEmail(input: {
  borrowerName: string;
  loanDisplayId: string;
  amountPesewas: number;
  dueDate: string;
}): EmailTemplate {
  const amountGhs = formatGhsAmount(input.amountPesewas);

  return buildEmailTemplate({
    subject: `WILMS payment reminder — ${input.loanDisplayId}`,
    greeting: input.borrowerName,
    preheader: `Payment of GHS ${amountGhs} due on ${input.dueDate}`,
    theme: 'warning',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your payment of GHS ${amountGhs} for loan ${input.loanDisplayId} is due on ${input.dueDate}.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert(`Payment of GHS ${amountGhs} is due on ${input.dueDate}.`, 'warning'),
      emailCard('Payment Due', [
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Amount Due', value: `GHS ${amountGhs}` },
        { label: 'Due Date', value: input.dueDate },
      ]),
      emailButton('View Payment', 'https://wilms.vercel.app/loans', 'warning'),
    ].join(''),
  });
}

export function buildCollectionReminderEmail(input: {
  borrowerName: string;
  amountPesewas: number;
  collectorName: string;
  collectionDate: string;
}): EmailTemplate {
  const amountGhs = formatGhsAmount(input.amountPesewas);

  return buildEmailTemplate({
    subject: 'WILMS collection reminder',
    greeting: input.borrowerName,
    preheader: `Collection of GHS ${amountGhs} scheduled for ${input.collectionDate}`,
    theme: 'info',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your collector ${input.collectorName} will collect GHS ${amountGhs} on ${input.collectionDate}.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph(`Your collector <strong>${input.collectorName}</strong> will visit on <strong>${input.collectionDate}</strong>.`),
      emailCard('Collection Details', [
        { label: 'Collector', value: input.collectorName },
        { label: 'Amount', value: `GHS ${amountGhs}` },
        { label: 'Date', value: input.collectionDate },
      ]),
    ].join(''),
  });
}

export function buildGroupCreatedEmail(input: {
  recipientName: string;
  groupName: string;
  groupDisplayId: string;
  community: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: `New group created — ${input.groupName}`,
    greeting: input.recipientName,
    preheader: `Group ${input.groupDisplayId} has been created`,
    theme: 'info',
    textLines: [
      `Hello ${input.recipientName},`,
      '',
      `A new group "${input.groupName}" (${input.groupDisplayId}) has been created in ${input.community}.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph('A new lending group has been created.'),
      emailCard('Group Details', [
        { label: 'Group Name', value: input.groupName },
        { label: 'Group ID', value: input.groupDisplayId },
        { label: 'Community', value: input.community },
      ]),
      emailButton('View Group', 'https://wilms.vercel.app/groups', 'info'),
    ].join(''),
  });
}

export function buildGroupLeaderAssignedEmail(input: {
  leaderName: string;
  groupName: string;
  groupDisplayId: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: `You have been assigned as group leader — ${input.groupName}`,
    greeting: input.leaderName,
    preheader: `You are now the leader of ${input.groupName}`,
    theme: 'success',
    textLines: [
      `Dear ${input.leaderName},`,
      '',
      `You have been assigned as the leader of group "${input.groupName}" (${input.groupDisplayId}).`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert(`You are now the leader of ${input.groupName}.`, 'success'),
      emailCard('Group Details', [
        { label: 'Group Name', value: input.groupName },
        { label: 'Group ID', value: input.groupDisplayId },
        { label: 'Your Role', value: 'Group Leader' },
      ]),
    ].join(''),
  });
}

export function buildCollectorAssignedEmail(input: {
  collectorName: string;
  groupName: string;
  groupDisplayId: string;
  memberCount: number;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: `Collector assignment — ${input.groupName}`,
    greeting: input.collectorName,
    preheader: `You have been assigned to group ${input.groupName}`,
    theme: 'info',
    textLines: [
      `Hello ${input.collectorName},`,
      '',
      `You have been assigned as collector for group "${input.groupName}" (${input.groupDisplayId}) with ${input.memberCount} members.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph(`You have been assigned as collector for <strong>${input.groupName}</strong>.`),
      emailCard('Assignment Details', [
        { label: 'Group', value: input.groupName },
        { label: 'Group ID', value: input.groupDisplayId },
        { label: 'Members', value: String(input.memberCount) },
      ]),
      emailButton('View Group', 'https://wilms.vercel.app/groups', 'info'),
    ].join(''),
  });
}

export function buildUserRoleChangedEmail(input: {
  displayName: string;
  previousRole: string;
  newRole: string;
  appUrl?: string;
}): EmailTemplate {
  const loginUrl = input.appUrl?.trim() || 'https://wilms.vercel.app/login';

  return buildEmailTemplate({
    subject: 'Your WILMS role has been updated',
    greeting: input.displayName,
    preheader: `Your role has changed from ${input.previousRole} to ${input.newRole}`,
    theme: 'info',
    textLines: [
      `Hello ${input.displayName},`,
      '',
      `Your WILMS role has been updated from ${input.previousRole} to ${input.newRole}.`,
      `Sign in: ${loginUrl}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailParagraph('Your account role has been updated.'),
      emailCard('Role Change', [
        { label: 'Previous Role', value: input.previousRole },
        { label: 'New Role', value: input.newRole },
      ]),
      emailDivider(),
      emailButton('Login', loginUrl, 'info'),
    ].join(''),
  });
}

export function buildLoanDisbursedEmail(input: {
  borrowerName: string;
  loanDisplayId: string;
  amountPesewas: number;
  disbursedDate: string;
}): EmailTemplate {
  const amountGhs = formatGhsAmount(input.amountPesewas);

  return buildEmailTemplate({
    subject: `WILMS loan disbursed — ${input.loanDisplayId}`,
    greeting: input.borrowerName,
    preheader: `GHS ${amountGhs} disbursed for loan ${input.loanDisplayId}`,
    theme: 'success',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your loan ${input.loanDisplayId} for GHS ${amountGhs} has been disbursed on ${input.disbursedDate}.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert(`GHS ${amountGhs} has been disbursed to your account.`, 'success'),
      emailCard('Disbursement Details', [
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Amount', value: `GHS ${amountGhs}` },
        { label: 'Date', value: input.disbursedDate },
      ]),
      emailButton('View Loan', 'https://wilms.vercel.app/loans', 'success'),
    ].join(''),
  });
}

// ─── Authentication & security (v1.3.5 catalogue) ─────────────────────────────

export function buildVerifyEmailEmail(input: {
  displayName: string;
  verifyUrl: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: 'Verify your WILMS email address',
    greeting: input.displayName,
    preheader: 'Confirm your email to secure your WILMS account',
    theme: 'info',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      'Please verify your email address to complete your WILMS account setup.',
      input.verifyUrl,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner('Action required', 'Verify your email to activate secure account features.', 'info'),
      emailParagraph('Click the button below to confirm your email address.'),
      emailButton('Verify Email', input.verifyUrl, 'info'),
      emailSecondaryButton('Copy link', input.verifyUrl),
    ].join(''),
  });
}

export function buildPasswordChangedEmail(input: {
  displayName: string;
  changedAt: string;
  loginUrl: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: 'Your WILMS password was changed',
    greeting: input.displayName,
    preheader: 'Your password was updated successfully',
    theme: 'success',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      `Your password was changed on ${input.changedAt}.`,
      'If you did not make this change, contact support immediately.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner('Password updated', `Changed on ${input.changedAt}.`, 'success'),
      emailAlert('If you did not request this change, contact support immediately.', 'warning'),
      emailButton('Sign in', input.loginUrl, 'primary'),
    ].join(''),
  });
}

export function buildLoginOtpEmail(input: {
  displayName: string;
  code: string;
  expiresMinutes?: number;
}): EmailTemplate {
  const expiresMinutes = input.expiresMinutes ?? 10;

  return buildEmailTemplate({
    subject: 'Your WILMS sign-in code',
    greeting: input.displayName,
    preheader: `Your WILMS sign-in code: ${input.code}`,
    theme: 'info',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      `Your WILMS sign-in code is ${input.code}.`,
      `It expires in ${expiresMinutes} minutes.`,
      '',
      'If you did not request this code, you can ignore this email.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner(
        'Sign-in verification',
        'Use this one-time code to complete your login.',
        'info',
      ),
      emailParagraph('Enter the code below on the WILMS sign-in screen:'),
      emailOtpCode(input.code),
      emailCard('Code details', [
        { label: 'Expires in', value: `${expiresMinutes} minutes` },
        { label: 'Security', value: 'Never share this code with anyone' },
      ]),
      emailAlert(
        'WILMS staff will never ask for this code by phone or email.',
        'warning',
      ),
    ].join(''),
  });
}

export function buildLoginAlertEmail(input: {
  displayName: string;
  loginAt: string;
  deviceLabel?: string;
  locationLabel?: string;
  loginUrl: string;
}): EmailTemplate {
  const rows = [
    { label: 'Time', value: input.loginAt },
    ...(input.deviceLabel ? [{ label: 'Device', value: input.deviceLabel }] : []),
    ...(input.locationLabel ? [{ label: 'Location', value: input.locationLabel }] : []),
  ];

  return buildEmailTemplate({
    subject: 'New sign-in to your WILMS account',
    greeting: input.displayName,
    preheader: 'A new sign-in was detected on your account',
    theme: 'info',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      `A new sign-in occurred on ${input.loginAt}.`,
      'If this was not you, reset your password immediately.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner('Security notice', 'A new sign-in was detected on your account.', 'info'),
      emailCard('Sign-in details', rows),
      emailButton('Review account', input.loginUrl, 'primary'),
    ].join(''),
  });
}

export function buildInvitationAcceptedEmail(input: {
  displayName: string;
  acceptedAt: string;
  role: string;
  loginUrl: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: 'Your WILMS invitation was accepted',
    greeting: input.displayName,
    preheader: `Welcome — your ${input.role} account is active`,
    theme: 'success',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      `Your invitation was accepted on ${input.acceptedAt}. Role: ${input.role}.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner('Invitation accepted', `Your ${input.role} account is now active.`, 'success'),
      emailButton('Open WILMS', input.loginUrl, 'success'),
    ].join(''),
  });
}

export function buildInvitationExpiredEmail(input: {
  displayName: string;
  expiredAt: string;
  supportEmail: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: 'Your WILMS invitation has expired',
    greeting: input.displayName,
    preheader: 'Request a new invitation from your administrator',
    theme: 'warning',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      `Your invitation expired on ${input.expiredAt}. Contact ${input.supportEmail} for a new invite.`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner('Invitation expired', `Expired on ${input.expiredAt}.`, 'warning'),
      emailParagraph(`Contact <a href="mailto:${input.supportEmail}">${input.supportEmail}</a> to request a new invitation.`),
    ].join(''),
  });
}

export function buildMaintenanceNoticeEmail(input: {
  displayName: string;
  windowStart: string;
  windowEnd: string;
  summary: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: 'Scheduled WILMS maintenance',
    greeting: input.displayName,
    preheader: input.summary,
    theme: 'warning',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      input.summary,
      `Window: ${input.windowStart} — ${input.windowEnd}`,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner('Maintenance', input.summary, 'warning'),
      emailCard('Schedule', [
        { label: 'Starts', value: input.windowStart },
        { label: 'Ends', value: input.windowEnd },
      ]),
    ].join(''),
  });
}

export function buildAnnouncementEmail(input: {
  displayName: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): EmailTemplate {
  return buildEmailTemplate({
    subject: `WILMS announcement — ${input.headline}`,
    greeting: input.displayName,
    preheader: input.headline,
    theme: 'info',
    textLines: [
      `Dear ${input.displayName},`,
      '',
      input.headline,
      input.body,
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailStatusBanner('Announcement', input.headline, 'info'),
      emailParagraph(input.body),
      ...(input.ctaLabel && input.ctaUrl ? [emailButton(input.ctaLabel, input.ctaUrl, 'info')] : []),
    ].join(''),
  });
}
