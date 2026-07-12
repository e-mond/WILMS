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
  outstandingBalancePesewas?: number;
}

export interface LoanApprovalEmailInput {
  borrowerName: string;
  amountPesewas: number;
  loanDisplayId: string;
}

export function formatGhsAmount(amountPesewas: number): string {
  return (amountPesewas / 100).toFixed(2);
}

// ─── SMS templates ───────────────────────────────────────────────────────────

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

export function buildRegistrationRejectedSmsBody(input: { borrowerName: string }): string {
  return `WILMS: Hi ${input.borrowerName}, your registration could not be approved. Contact your registration officer for details.`;
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

export function buildLoanReminderSmsBody(input: {
  borrowerName: string;
  loanDisplayId: string;
  amountPesewas: number;
  dueDate: string;
}): string {
  const amountGhs = formatGhsAmount(input.amountPesewas);
  return `WILMS: Hi ${input.borrowerName}, payment of GHS ${amountGhs} for loan ${input.loanDisplayId} is due on ${input.dueDate}.`;
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

  return buildEmailTemplate({
    subject: `WILMS loan approved — ${input.loanDisplayId}`,
    greeting: input.borrowerName,
    preheader: `Your loan ${input.loanDisplayId} for GHS ${amountGhs} has been approved`,
    theme: 'success',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      `Your interest-free loan application (${input.loanDisplayId}) for GHS ${amountGhs} has been approved.`,
      'Your collector will contact you about disbursement and weekly repayments.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Your loan application has been approved!', 'success'),
      emailCard('Loan Details', [
        { label: 'Loan ID', value: input.loanDisplayId },
        { label: 'Approved Amount', value: `GHS ${amountGhs}` },
      ]),
      emailParagraph('Your collector will contact you about disbursement and weekly repayments.'),
      emailButton('View Loan', `https://wilms.vercel.app/loans`),
    ].join(''),
  });
}

export function buildUserInvitationEmail(input: {
  displayName: string;
  email: string;
  temporaryPassword: string;
  appUrl?: string;
  expiresAt?: Date;
}): EmailTemplate {
  const baseUrl = input.appUrl?.trim() || 'https://wilms.vercel.app';
  const acceptUrl = `${baseUrl.replace(/\/$/, '')}/accept-invitation?email=${encodeURIComponent(input.email)}`;
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
      'Please sign in and change your password immediately.',
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

export function buildRegistrationApprovedEmail(input: { borrowerName: string }): EmailTemplate {
  return buildEmailTemplate({
    subject: 'WILMS registration approved',
    greeting: input.borrowerName,
    preheader: 'Your registration has been approved',
    theme: 'success',
    textLines: [
      `Dear ${input.borrowerName},`,
      '',
      'Your registration has been approved. Your collector will contact you about next steps.',
      '',
      '— WILMS',
    ],
    htmlBody: [
      emailAlert('Congratulations! Your registration has been approved.', 'success'),
      emailParagraph('Your collector will contact you about next steps.'),
      emailButton('Complete Registration', 'https://wilms.vercel.app/login', 'success'),
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
