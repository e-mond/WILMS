import { env } from '../../config/env.js';
import { getSettings } from '../../modules/settings/service.js';
import { dispatchMail } from '../mail/dispatch.js';
import { getSmsProvider } from '../sms/index.js';
import { createInAppNotification } from './in-app-notify.js';
import {
  buildAccountActivatedEmail,
  buildAccountDisabledEmail,
  buildAccountEnabledEmail,
  buildBlacklistSmsBody,
  buildBorrowerRegistrationApprovalSmsBody,
  buildCollectionReminderEmail,
  buildCollectionReminderSmsBody,
  buildCollectorAssignedEmail,
  buildGroupCreatedEmail,
  buildGroupLeaderAssignedEmail,
  buildInvitationReminderEmail,
  buildLoanApprovalEmail,
  buildLoanApprovalSmsBody,
  buildLoanClosedEmail,
  buildLoanDefaultEmail,
  buildLoanDisbursedEmail,
  buildLoanDisbursedSmsBody,
  buildLoanFullyPaidEmail,
  buildLoanRejectedEmail,
  buildLoanRejectedSmsBody,
  buildLoanReminderEmail,
  buildLoanReminderSmsBody,
  buildMissedPaymentSmsBody,
  buildPasswordResetEmail,
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSmsBody,
  buildPaymentReversalEmail,
  buildRegistrationApprovedEmail,
  buildRegistrationRejectedEmail,
  buildRegistrationRejectedSmsBody,
  buildUserInvitationEmail,
  buildUserRoleChangedEmail,
  buildWelcomeEmail,
} from './templates.js';
import { logMessageDelivery } from './delivery-log.js';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 750;

function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  return digits;
}

async function dispatchSms(input: {
  event: string;
  to: string;
  body: string;
  enabled: boolean;
  borrowerId?: string;
  loanId?: string;
  userId?: string;
}): Promise<void> {
  if (!input.enabled || !input.to.trim()) return;

  const settings = await getSettings();
  if (!settings.smsNotificationsEnabled) return;

  const provider = getSmsProvider();
  if (!provider.isConfigured()) {
    await logMessageDelivery({
      event: input.event,
      channel: 'SMS',
      recipient: input.to,
      provider: provider.name,
      bodyPreview: input.body,
      success: false,
      failureReason: 'SMS provider is not configured.',
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      userId: input.userId,
    });
    return;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
      const result = await provider.send({
        to: normalizeGhanaPhone(input.to),
        body: input.body,
      });
      await logMessageDelivery({
        event: input.event,
        channel: 'SMS',
        recipient: input.to,
        provider: result.provider,
        providerMessageId: result.id,
        bodyPreview: input.body,
        success: true,
        retryAttempts: attempt,
        borrowerId: input.borrowerId,
        loanId: input.loanId,
        userId: input.userId,
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'SMS delivery failed.';
  await logMessageDelivery({
    event: input.event,
    channel: 'SMS',
    recipient: input.to,
    provider: provider.name,
    bodyPreview: input.body,
    success: false,
    failureReason: message,
    retryAttempts: MAX_RETRIES,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
    userId: input.userId,
  });
}

async function dispatchEmailWhenEnabled(input: {
  event: string;
  to?: string;
  subject: string;
  text: string;
  html: string;
  borrowerId?: string;
  loanId?: string;
  userId?: string;
  force?: boolean;
}): Promise<void> {
  if (!input.to?.trim()) return;

  const settings = await getSettings();
  if (!input.force && !settings.emailNotificationsEnabled) return;

  try {
    await dispatchMail({
      event: input.event,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      userId: input.userId,
    });
  } catch (error) {
    console.error(`[mail] ${input.event} failed:`, error);
  }
}

// ─── User notifications ──────────────────────────────────────────────────────

export async function notifyUserInvitation(input: {
  email: string;
  displayName: string;
  temporaryPassword: string;
  userId: string;
  phone?: string;
  expiresAt?: Date;
}): Promise<void> {
  const template = buildUserInvitationEmail({
    displayName: input.displayName,
    email: input.email,
    temporaryPassword: input.temporaryPassword,
    appUrl: env.appUrl,
    expiresAt: input.expiresAt,
  });

  await dispatchMail({
    event: 'USER_INVITED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    enableTracking: false,
    maxRetries: 0,
  });

  if (input.phone?.trim()) {
    const settings = await getSettings();
    await dispatchSms({
      event: 'USER_INVITED',
      to: input.phone,
      body: `WILMS: You have been invited. Check ${input.email} for your invitation email and tap Accept Invitation to set up your account.`,
      enabled: settings.smsNotificationsEnabled,
      userId: input.userId,
    });
  }

  void createInAppNotification({
    userId: input.userId,
    event: 'USER_INVITED',
    title: 'Welcome to WILMS',
    body: 'Your account has been created. Please sign in and change your password.',
    href: '/settings',
  });
}

export async function notifyInvitationReminder(input: {
  email: string;
  displayName: string;
  userId: string;
}): Promise<void> {
  const template = buildInvitationReminderEmail({
    displayName: input.displayName,
    email: input.email,
    appUrl: env.appUrl,
  });
  await dispatchEmailWhenEnabled({
    event: 'USER_INVITATION_REMINDER',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    force: true,
  });
}

export async function notifyWelcome(input: {
  email: string;
  displayName: string;
  role: string;
  userId: string;
}): Promise<void> {
  const template = buildWelcomeEmail({
    displayName: input.displayName,
    role: input.role,
    appUrl: env.appUrl,
  });
  await dispatchEmailWhenEnabled({
    event: 'USER_WELCOME',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    force: true,
  });
}

export async function notifyPasswordReset(input: {
  email: string;
  displayName: string;
  resetUrl: string;
  userId: string;
  phone?: string | null;
}): Promise<void> {
  const template = buildPasswordResetEmail({
    displayName: input.displayName,
    resetUrl: input.resetUrl,
  });
  await dispatchMail({
    event: 'PASSWORD_RESET',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
  });

  if (input.phone?.trim()) {
    const settings = await getSettings();
    await dispatchSms({
      event: 'PASSWORD_RESET',
      to: input.phone,
      body: `WILMS: Password reset requested. Check ${input.email} for the reset link. Link expires in 60 minutes.`,
      enabled: settings.smsNotificationsEnabled,
      userId: input.userId,
    });
  }
}

export async function notifyLoginOtp(input: {
  email: string;
  displayName: string;
  userId: string;
  phone?: string | null;
  code: string;
}): Promise<void> {
  const subject = 'Your WILMS sign-in code';
  const text = `Hello ${input.displayName}, your WILMS sign-in code is ${input.code}. It expires in 10 minutes.`;
  const html = `<p>Hello <strong>${input.displayName}</strong>,</p><p>Your WILMS sign-in code is <strong>${input.code}</strong>.</p><p>It expires in 10 minutes.</p>`;

  await dispatchMail({
    event: 'LOGIN_OTP',
    to: input.email,
    subject,
    text,
    html,
    userId: input.userId,
    enableTracking: false,
    maxRetries: 0,
  });

  if (input.phone?.trim()) {
    const settings = await getSettings();
    await dispatchSms({
      event: 'LOGIN_OTP',
      to: input.phone,
      body: `WILMS sign-in code: ${input.code}. Expires in 10 minutes.`,
      enabled: settings.smsNotificationsEnabled,
      userId: input.userId,
    });
  }
}

export async function notifyAccountActivated(input: {
  email: string;
  displayName: string;
  userId: string;
}): Promise<void> {
  const template = buildAccountActivatedEmail({
    displayName: input.displayName,
    appUrl: env.appUrl,
  });
  await dispatchEmailWhenEnabled({
    event: 'USER_ACTIVATED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    force: true,
  });
  void createInAppNotification({
    userId: input.userId,
    event: 'USER_ACTIVATED',
    title: 'Account activated',
    body: 'Your WILMS account is now active.',
    href: '/settings',
  });
}

export async function notifyAccountDisabled(input: {
  email: string;
  displayName: string;
  userId: string;
  reason?: string;
}): Promise<void> {
  const template = buildAccountDisabledEmail({
    displayName: input.displayName,
    reason: input.reason,
  });
  await dispatchEmailWhenEnabled({
    event: 'USER_DISABLED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    force: true,
  });
  void createInAppNotification({
    userId: input.userId,
    event: 'USER_DISABLED',
    title: 'Account disabled',
    body: input.reason ?? 'Your account has been disabled.',
  });
}

export async function notifyAccountEnabled(input: {
  email: string;
  displayName: string;
  userId: string;
}): Promise<void> {
  const template = buildAccountEnabledEmail({
    displayName: input.displayName,
    appUrl: env.appUrl,
  });
  await dispatchEmailWhenEnabled({
    event: 'USER_ENABLED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    force: true,
  });
  void createInAppNotification({
    userId: input.userId,
    event: 'USER_ACTIVATED',
    title: 'Account re-enabled',
    body: 'Your account access has been restored.',
    href: '/settings',
  });
}

export async function notifyUserRoleChanged(input: {
  email: string;
  displayName: string;
  userId: string;
  previousRole: string;
  newRole: string;
}): Promise<void> {
  const template = buildUserRoleChangedEmail({
    displayName: input.displayName,
    previousRole: input.previousRole,
    newRole: input.newRole,
    appUrl: env.appUrl,
  });
  await dispatchEmailWhenEnabled({
    event: 'ROLE_CHANGED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    force: true,
  });
  void createInAppNotification({
    userId: input.userId,
    event: 'ROLE_CHANGED',
    title: 'Role updated',
    body: `Your role changed from ${input.previousRole} to ${input.newRole}.`,
    href: '/settings',
  });
}

// ─── Registration notifications ──────────────────────────────────────────────

export async function notifyRegistrationApproved(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'REGISTRATION_APPROVED',
      to: input.borrowerPhone,
      body: buildBorrowerRegistrationApprovalSmsBody({ borrowerName: input.borrowerName }),
      enabled: settings.approvalSmsEnabled,
      borrowerId: input.borrowerId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildRegistrationApprovedEmail({ borrowerName: input.borrowerName });
    await dispatchEmailWhenEnabled({
      event: 'REGISTRATION_APPROVED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyRegistrationRejected(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  reason?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'REGISTRATION_REJECTED',
      to: input.borrowerPhone,
      body: buildRegistrationRejectedSmsBody({ borrowerName: input.borrowerName }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildRegistrationRejectedEmail({
      borrowerName: input.borrowerName,
      reason: input.reason,
    });
    await dispatchEmailWhenEnabled({
      event: 'REGISTRATION_REJECTED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyRegistrationBlacklisted(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  reason?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'BORROWER_BLACKLISTED',
      to: input.borrowerPhone,
      body: buildBlacklistSmsBody({ borrowerName: input.borrowerName }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }
}

// ─── Loan notifications ──────────────────────────────────────────────────────

export async function notifyLoanApproved(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  loanId: string;
  loanDisplayId: string;
  collectorUserId?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'LOAN_APPROVED',
      to: input.borrowerPhone,
      body: buildLoanApprovalSmsBody({
        borrowerName: input.borrowerName,
        amountPesewas: input.amountPesewas,
      }),
      enabled: settings.approvalSmsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildLoanApprovalEmail({
      borrowerName: input.borrowerName,
      amountPesewas: input.amountPesewas,
      loanDisplayId: input.loanDisplayId,
    });
    await dispatchEmailWhenEnabled({
      event: 'LOAN_APPROVED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.collectorUserId) {
    void createInAppNotification({
      userId: input.collectorUserId,
      event: 'LOAN_APPROVED',
      title: 'Loan approved',
      body: `Loan ${input.loanDisplayId} for ${input.borrowerName} has been approved.`,
      href: `/loans`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyLoanRejected(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  reason?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'LOAN_REJECTED',
      to: input.borrowerPhone,
      body: buildLoanRejectedSmsBody({ borrowerName: input.borrowerName }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildLoanRejectedEmail({
      borrowerName: input.borrowerName,
      loanDisplayId: input.loanDisplayId,
      reason: input.reason,
    });
    await dispatchEmailWhenEnabled({
      event: 'LOAN_REJECTED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyLoanDisbursed(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  amountPesewas: number;
  disbursedDate?: string;
  collectorUserId?: string;
}): Promise<void> {
  const settings = await getSettings();
  const disbursedDate = input.disbursedDate ?? new Date().toISOString().slice(0, 10);

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'LOAN_DISBURSED',
      to: input.borrowerPhone,
      body: buildLoanDisbursedSmsBody(input),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildLoanDisbursedEmail({
      borrowerName: input.borrowerName,
      loanDisplayId: input.loanDisplayId,
      amountPesewas: input.amountPesewas,
      disbursedDate,
    });
    await dispatchEmailWhenEnabled({
      event: 'LOAN_DISBURSED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.collectorUserId) {
    void createInAppNotification({
      userId: input.collectorUserId,
      event: 'LOAN_DISBURSED',
      title: 'Loan disbursed',
      body: `Loan ${input.loanDisplayId} for ${input.borrowerName} has been disbursed.`,
      href: `/loans`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyLoanClosed(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
}): Promise<void> {
  if (input.borrowerEmail) {
    const template = buildLoanClosedEmail({
      borrowerName: input.borrowerName,
      loanDisplayId: input.loanDisplayId,
    });
    await dispatchEmailWhenEnabled({
      event: 'LOAN_CLOSED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyLoanFullyPaid(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  totalPaidPesewas: number;
  collectorUserId?: string;
}): Promise<void> {
  if (input.borrowerEmail) {
    const template = buildLoanFullyPaidEmail({
      borrowerName: input.borrowerName,
      loanDisplayId: input.loanDisplayId,
      totalPaidPesewas: input.totalPaidPesewas,
    });
    await dispatchEmailWhenEnabled({
      event: 'LOAN_COMPLETED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.collectorUserId) {
    void createInAppNotification({
      userId: input.collectorUserId,
      event: 'LOAN_COMPLETED',
      title: 'Loan fully paid',
      body: `${input.borrowerName} has fully repaid loan ${input.loanDisplayId}.`,
      href: `/loans`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyLoanDefault(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  loanId: string;
  loanDisplayId: string;
  outstandingPesewas: number;
  weeksOverdue: number;
  collectorUserId?: string;
}): Promise<void> {
  if (input.borrowerEmail) {
    const template = buildLoanDefaultEmail(input);
    await dispatchEmailWhenEnabled({
      event: 'DEFAULTER_STATUS',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.collectorUserId) {
    void createInAppNotification({
      userId: input.collectorUserId,
      event: 'DEFAULTER_STATUS',
      title: 'Loan default',
      body: `${input.borrowerName} loan ${input.loanDisplayId} is in default.`,
      href: `/borrowers/${input.borrowerId}`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyLoanReminder(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  amountPesewas: number;
  dueDate: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'PAYMENT_REMINDER',
      to: input.borrowerPhone,
      body: buildLoanReminderSmsBody(input),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildLoanReminderEmail(input);
    await dispatchEmailWhenEnabled({
      event: 'PAYMENT_REMINDER',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

// ─── Payment notifications ───────────────────────────────────────────────────

export async function notifyPaymentReceived(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  paymentDate: string;
  loanDisplayId: string;
  loanId?: string;
  outstandingBalancePesewas?: number;
  collectorUserId?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'PAYMENT_RECEIVED',
      to: input.borrowerPhone,
      body: buildPaymentConfirmationSmsBody({
        amountPesewas: input.amountPesewas,
        paymentDate: input.paymentDate,
      }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildPaymentConfirmationEmail({
      borrowerName: input.borrowerName,
      amountPesewas: input.amountPesewas,
      paymentDate: input.paymentDate,
      loanDisplayId: input.loanDisplayId,
      outstandingBalancePesewas: input.outstandingBalancePesewas,
    });
    await dispatchEmailWhenEnabled({
      event: 'PAYMENT_RECEIVED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

  if (input.collectorUserId) {
    void createInAppNotification({
      userId: input.collectorUserId,
      event: 'PAYMENT_RECEIVED',
      title: 'Payment received',
      body: `GHS ${(input.amountPesewas / 100).toFixed(2)} received from ${input.borrowerName}.`,
      href: `/reports/daily-collection`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyMissedPayment(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  weeksOverdue: number;
  amountPesewas: number;
  loanId?: string;
}): Promise<void> {
  const settings = await getSettings();
  if (!input.borrowerPhone) return;

  await dispatchSms({
    event: 'MISSED_PAYMENT',
    to: input.borrowerPhone,
    body: buildMissedPaymentSmsBody(input),
    enabled: settings.smsNotificationsEnabled && settings.missedPaymentSmsEnabled,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
  });
}

export async function notifyPaymentReversal(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  amountPesewas: number;
  loanDisplayId: string;
  loanId: string;
  reason: string;
  reversalDate: string;
}): Promise<void> {
  if (input.borrowerEmail) {
    const template = buildPaymentReversalEmail({
      borrowerName: input.borrowerName,
      amountPesewas: input.amountPesewas,
      loanDisplayId: input.loanDisplayId,
      reason: input.reason,
      reversalDate: input.reversalDate,
    });
    await dispatchEmailWhenEnabled({
      event: 'PAYMENT_REVERSAL',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
}

export async function notifyCollectionReminder(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  collectorName: string;
  collectionDate: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'COLLECTION_REMINDER',
      to: input.borrowerPhone,
      body: buildCollectionReminderSmsBody(input),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildCollectionReminderEmail(input);
    await dispatchEmailWhenEnabled({
      event: 'COLLECTION_REMINDER',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
    });
  }
}

// ─── Group notifications ─────────────────────────────────────────────────────

export async function notifyGroupCreated(input: {
  recipientEmail: string;
  recipientName: string;
  recipientUserId?: string;
  groupName: string;
  groupDisplayId: string;
  community: string;
}): Promise<void> {
  const template = buildGroupCreatedEmail(input);
  await dispatchEmailWhenEnabled({
    event: 'GROUP_CREATED',
    to: input.recipientEmail,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.recipientUserId,
  });

  if (input.recipientUserId) {
    void createInAppNotification({
      userId: input.recipientUserId,
      event: 'GROUP_CREATED',
      title: 'New group created',
      body: `Group ${input.groupName} (${input.groupDisplayId}) created in ${input.community}.`,
      href: '/groups',
    });
  }
}

export async function notifyGroupLeaderAssigned(input: {
  leaderEmail?: string;
  leaderName: string;
  leaderUserId?: string;
  groupName: string;
  groupDisplayId: string;
}): Promise<void> {
  if (input.leaderEmail) {
    const template = buildGroupLeaderAssignedEmail(input);
    await dispatchEmailWhenEnabled({
      event: 'GROUP_CREATED',
      to: input.leaderEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }
}

export async function notifyCollectorAssigned(input: {
  collectorEmail: string;
  collectorName: string;
  collectorUserId: string;
  groupName: string;
  groupDisplayId: string;
  memberCount: number;
}): Promise<void> {
  const template = buildCollectorAssignedEmail(input);
  await dispatchEmailWhenEnabled({
    event: 'COLLECTOR_ASSIGNED',
    to: input.collectorEmail,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.collectorUserId,
  });

  void createInAppNotification({
    userId: input.collectorUserId,
    event: 'COLLECTOR_ASSIGNED',
    title: 'Group assignment',
    body: `You have been assigned to group ${input.groupName}.`,
    href: '/groups',
  });
}
