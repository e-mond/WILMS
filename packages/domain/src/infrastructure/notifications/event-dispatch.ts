import { env } from '../../config/env.js';
import { shouldSendChannel } from '../../modules/notifications/preferences.service.js';
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
  buildGroupAssignedSmsBody,
  buildGroupCreatedEmail,
  buildGroupLeaderAssignedEmail,
  buildInvitationReminderEmail,
  buildLoanApprovalEmail,
  buildLoanApprovalSmsBody,
  buildLoanClosedEmail,
  buildLoanDefaultEmail,
  buildLoanDisbursedEmail,
  buildLoanDisbursedSmsBody,
  buildLoanDisbursedScheduleSmsBody,
  buildLoanFullyPaidEmail,
  buildLoanCompletedSmsBody,
  buildLoanCreatedSmsBody,
  buildLoanRejectedEmail,
  buildLoanRejectedSmsBody,
  buildLoanReminderEmail,
  buildLoanReminderSmsBody,
  buildMissedPaymentSmsBody,
  buildPasswordResetEmail,
  buildPasswordChangedEmail,
  buildLoginAlertEmail,
  buildLoginOtpEmail,
  buildInvitationAcceptedEmail,
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSmsBody,
  buildPaymentReversalEmail,
  buildRegistrationApprovedEmail,
  buildRegistrationRejectedEmail,
  buildRegistrationRejectedSmsBody,
  buildRegistrationSubmittedEmail,
  buildRegistrationSubmittedSmsBody,
  buildUserInvitationEmail,
  buildUserRoleChangedEmail,
  buildWelcomeEmail,
  buildCollectorReassignedSmsBody,
  buildBorrowerUpdateApprovedSmsBody,
  buildBorrowerUpdateRejectedSmsBody,
  buildRegistrationEscalatedSmsBody,
  buildGuarantorLoanApprovedSmsBody,
  buildGuarantorLoanFullyRepaidSmsBody,
  buildGuarantorMissedPaymentsSmsBody,
} from './templates.js';
import { logMessageDelivery } from './delivery-log.js';
import {
  markNotificationDeliveryStatus,
  tryAcquireNotificationDelivery,
} from './notification-dedupe.js';
import { normalizeGhanaPhone } from '../sms/normalize-phone.js';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 750;

export interface SmsDispatchResult {
  success: boolean;
  failureReason?: string;
  providerMessageId?: string;
}

async function dispatchSms(input: {
  event: string;
  to: string;
  body: string;
  enabled: boolean;
  borrowerId?: string;
  loanId?: string;
  userId?: string;
}): Promise<SmsDispatchResult> {
  if (!input.enabled || !input.to.trim()) {
    return { success: false, failureReason: 'SMS notifications are disabled or recipient is missing.' };
  }

  const settings = await getSettings();
  if (!settings.smsNotificationsEnabled) {
    return { success: false, failureReason: 'SMS notifications are disabled in system settings.' };
  }

  const provider = getSmsProvider();
  if (!provider.isConfigured()) {
    const failureReason = 'SMS provider is not configured.';
    await logMessageDelivery({
      event: input.event,
      channel: 'SMS',
      recipient: input.to,
      provider: provider.name,
      bodyPreview: input.body,
      success: false,
      failureReason,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      userId: input.userId,
    });
    return { success: false, failureReason };
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
      return { success: true, providerMessageId: result.id };
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
  return { success: false, failureReason: message };
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
  category?: 'marketing' | 'announcement' | 'reminder' | 'loan' | 'payment' | 'approval' | 'registration';
}): Promise<void> {
  if (!input.to?.trim()) return;

  if (input.userId && !input.force) {
    const allowed = await shouldSendChannel(input.userId, 'EMAIL', input.category);
    if (!allowed) return;
  }

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
  invitationToken?: string;
}): Promise<{
  emailSent: boolean;
  emailError?: string;
  smsSent: boolean;
  smsError?: string;
}> {
  const template = buildUserInvitationEmail({
    displayName: input.displayName,
    email: input.email,
    temporaryPassword: input.temporaryPassword,
    invitationToken: input.invitationToken,
    appUrl: env.appUrl,
    expiresAt: input.expiresAt,
  });

  let emailSent = false;
  let emailError: string | undefined;
  try {
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
    emailSent = true;
  } catch (error) {
    emailError = error instanceof Error ? error.message : 'Email delivery failed.';
  }

  let smsSent = false;
  let smsError: string | undefined;
  if (input.phone?.trim()) {
    const settings = await getSettings();
    const smsResult = await dispatchSms({
      event: 'USER_INVITED',
      to: input.phone,
      body: `WILMS: You have been invited. Check ${input.email} for your invitation email and tap Accept Invitation to set up your account.`,
      enabled: settings.smsNotificationsEnabled,
      userId: input.userId,
    });
    smsSent = smsResult.success;
    smsError = smsResult.failureReason;
  }

  void createInAppNotification({
    userId: input.userId,
    event: 'USER_INVITED',
    title: 'Welcome to WILMS',
    body: 'Your account has been created. Please sign in and change your password.',
    href: '/settings',
  });

  return { emailSent, emailError, smsSent, smsError };
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

export async function notifyPasswordChanged(input: {
  email: string;
  displayName: string;
  userId: string;
  changedAt?: string;
}): Promise<void> {
  const loginUrl = `${(env.appUrl ?? 'https://wilms.vercel.app').replace(/\/$/, '')}/login`;
  const template = buildPasswordChangedEmail({
    displayName: input.displayName,
    changedAt: input.changedAt ?? new Date().toISOString(),
    loginUrl,
  });
  await dispatchEmailWhenEnabled({
    event: 'PASSWORD_CHANGED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    category: 'registration',
  });
  void createInAppNotification({
    userId: input.userId,
    event: 'PASSWORD_CHANGED',
    title: 'Password changed',
    body: 'Your account password was updated successfully.',
    href: '/settings',
  });
}

export async function notifyLoginAlert(input: {
  email: string;
  displayName: string;
  userId: string;
  loginAt?: string;
  deviceLabel?: string;
  locationLabel?: string;
}): Promise<void> {
  const loginUrl = `${(env.appUrl ?? 'https://wilms.vercel.app').replace(/\/$/, '')}/login`;
  const loginAt = input.loginAt ?? new Date().toISOString();
  const template = buildLoginAlertEmail({
    displayName: input.displayName,
    loginAt,
    deviceLabel: input.deviceLabel,
    locationLabel: input.locationLabel,
    loginUrl,
  });

  await dispatchEmailWhenEnabled({
    event: 'LOGIN_ALERT',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
  });

  const inAppAllowed = await shouldSendChannel(input.userId, 'IN_APP');
  if (inAppAllowed) {
    void createInAppNotification({
      userId: input.userId,
      event: 'LOGIN_ALERT',
      title: 'New sign-in detected',
      body: `A sign-in occurred on ${loginAt}.`,
      href: '/settings',
    });
  }
}

export async function notifyInvitationAccepted(input: {
  email: string;
  displayName: string;
  role: string;
  userId: string;
}): Promise<void> {
  const loginUrl = `${(env.appUrl ?? 'https://wilms.vercel.app').replace(/\/$/, '')}/login`;
  const template = buildInvitationAcceptedEmail({
    displayName: input.displayName,
    acceptedAt: new Date().toISOString(),
    role: input.role,
    loginUrl,
  });
  await dispatchEmailWhenEnabled({
    event: 'INVITATION_ACCEPTED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
    category: 'registration',
  });
  void createInAppNotification({
    userId: input.userId,
    event: 'INVITATION_ACCEPTED',
    title: 'Invitation accepted',
    body: `Your ${input.role} account is now active.`,
    href: loginUrl,
  });
}

export async function notifyLoginOtp(input: {
  email: string;
  displayName: string;
  userId: string;
  phone?: string | null;
  code: string;
}): Promise<void> {
  const template = buildLoginOtpEmail({
    displayName: input.displayName,
    code: input.code,
  });

  await dispatchMail({
    event: 'LOGIN_OTP',
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

export async function notifyRegistrationSubmitted(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  officerUserId?: string;
  reference?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'REGISTRATION_SUBMITTED',
      to: input.borrowerPhone,
      body: buildRegistrationSubmittedSmsBody({
        borrowerName: input.borrowerName,
        reference: input.reference,
      }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildRegistrationSubmittedEmail({ borrowerName: input.borrowerName });
    await dispatchEmailWhenEnabled({
      event: 'REGISTRATION_SUBMITTED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      category: 'registration',
    });
  }

  if (input.officerUserId) {
    void createInAppNotification({
      userId: input.officerUserId,
      event: 'REGISTRATION_APPROVED',
      title: 'Registration submitted',
      body: `${input.borrowerName} submitted a registration for review.`,
      href: '/approver/pending',
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyRegistrationApproved(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  groupName?: string;
  collectorName?: string;
  nextStep?: string;
}): Promise<void> {
  const settings = await getSettings();

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'REGISTRATION_APPROVED',
      to: input.borrowerPhone,
      body: buildBorrowerRegistrationApprovalSmsBody({
        borrowerName: input.borrowerName,
        groupName: input.groupName,
        collectorName: input.collectorName,
        nextStep: input.nextStep,
      }),
      enabled: settings.approvalSmsEnabled,
      borrowerId: input.borrowerId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildRegistrationApprovedEmail({
      borrowerName: input.borrowerName,
      groupName: input.groupName,
      collectorName: input.collectorName,
      nextStep: input.nextStep,
    });
    await dispatchEmailWhenEnabled({
      event: 'REGISTRATION_APPROVED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      category: 'registration',
    });
  }
}

export async function notifyGroupAssigned(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  groupName: string;
  collectorName?: string;
  collectorUserId?: string;
  actorUserId?: string;
  /** Borrower SMS is only sent after registration approval (or later reassignment). */
  notifyBorrower?: boolean;
}): Promise<void> {
  const settings = await getSettings();

  if (input.notifyBorrower && input.borrowerPhone) {
    await dispatchSms({
      event: 'GROUP_ASSIGNED',
      to: input.borrowerPhone,
      body: buildGroupAssignedSmsBody({
        borrowerName: input.borrowerName,
        groupName: input.groupName,
        collectorName: input.collectorName,
      }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }

  if (input.collectorUserId) {
    void createInAppNotification({
      userId: input.collectorUserId,
      event: 'COLLECTOR_ASSIGNED',
      title: 'New group member',
      body: `${input.borrowerName} was assigned to ${input.groupName}.`,
      href: '/collector/my-borrowers',
      borrowerId: input.borrowerId,
    });
  }

  if (input.actorUserId) {
    void createInAppNotification({
      userId: input.actorUserId,
      event: 'GROUP_CREATED',
      title: 'Group assignment complete',
      body: `${input.borrowerName} is now in ${input.groupName}.`,
      href: '/groups',
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
  officerUserId?: string;
  actorUserId?: string;
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

  if (input.officerUserId) {
    void createInAppNotification({
      userId: input.officerUserId,
      event: 'REGISTRATION_REJECTED',
      title: 'Registration rejected',
      body: `${input.borrowerName}'s registration was not approved.`,
      href: '/approver/reviewed',
      borrowerId: input.borrowerId,
    });
  }

  if (input.actorUserId && input.actorUserId !== input.officerUserId) {
    void createInAppNotification({
      userId: input.actorUserId,
      event: 'REGISTRATION_REJECTED',
      title: 'Registration decision recorded',
      body: `${input.borrowerName} was rejected.`,
      href: '/approver/reviewed',
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyRegistrationBlacklisted(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  reason?: string;
  officerUserId?: string;
  actorUserId?: string;
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

  if (input.officerUserId) {
    void createInAppNotification({
      userId: input.officerUserId,
      event: 'BORROWER_BLACKLISTED',
      title: 'Registration blacklisted',
      body: `${input.borrowerName}'s registration was blacklisted.`,
      href: '/approver/reviewed',
      borrowerId: input.borrowerId,
    });
  }

  if (input.actorUserId && input.actorUserId !== input.officerUserId) {
    void createInAppNotification({
      userId: input.actorUserId,
      event: 'BORROWER_BLACKLISTED',
      title: 'Registration decision recorded',
      body: `${input.borrowerName} was blacklisted.`,
      href: '/approver/reviewed',
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyRegistrationEscalated(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  officerUserId?: string;
  actorUserId?: string;
}): Promise<void> {
  const settings = await getSettings();
  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'SUPERVISOR_ALERT',
      to: input.borrowerPhone,
      body: buildRegistrationEscalatedSmsBody({ borrowerName: input.borrowerName }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }
  if (input.officerUserId) {
    void createInAppNotification({
      userId: input.officerUserId,
      event: 'SUPERVISOR_ALERT',
      title: 'Registration escalated',
      body: `${input.borrowerName} requires additional review.`,
      href: '/approver/pending',
      borrowerId: input.borrowerId,
    });
  }
  if (input.actorUserId) {
    void createInAppNotification({
      userId: input.actorUserId,
      event: 'SUPERVISOR_ALERT',
      title: 'Escalation recorded',
      body: `${input.borrowerName} has been escalated for additional review.`,
      href: '/approver/pending',
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyGuarantorLoanApproved(input: {
  guarantorName: string;
  guarantorPhone?: string;
  borrowerId: string;
  borrowerName: string;
}): Promise<void> {
  if (!input.guarantorPhone?.trim()) return;
  const settings = await getSettings();
  await dispatchSms({
    event: 'GUARANTOR_ALERT',
    to: input.guarantorPhone,
    body: buildGuarantorLoanApprovedSmsBody({
      guarantorName: input.guarantorName,
      borrowerName: input.borrowerName,
    }),
    enabled: settings.smsNotificationsEnabled,
    borrowerId: input.borrowerId,
  });
}

export async function notifyGuarantorLoanFullyRepaid(input: {
  guarantorName: string;
  guarantorPhone?: string;
  borrowerId: string;
  borrowerName: string;
}): Promise<void> {
  if (!input.guarantorPhone?.trim()) return;
  const settings = await getSettings();
  await dispatchSms({
    event: 'GUARANTOR_ALERT',
    to: input.guarantorPhone,
    body: buildGuarantorLoanFullyRepaidSmsBody({
      guarantorName: input.guarantorName,
      borrowerName: input.borrowerName,
    }),
    enabled: settings.smsNotificationsEnabled,
    borrowerId: input.borrowerId,
  });
}

export async function notifyGuarantorMissedPayments(input: {
  guarantorName: string;
  guarantorPhone?: string;
  borrowerId: string;
  borrowerName: string;
}): Promise<void> {
  if (!input.guarantorPhone?.trim()) return;
  const settings = await getSettings();
  const dedupeKey = `guarantor-missed:${input.borrowerId}`;
  const acquired = await tryAcquireNotificationDelivery({
    dedupeKey,
    recipient: input.guarantorPhone,
    channel: 'SMS',
    notificationType: 'GUARANTOR_MISSED_PAYMENTS',
    borrowerId: input.borrowerId,
  });
  if (!acquired) return;

  const result = await dispatchSms({
    event: 'GUARANTOR_ALERT',
    to: input.guarantorPhone,
    body: buildGuarantorMissedPaymentsSmsBody({
      guarantorName: input.guarantorName,
      borrowerName: input.borrowerName,
    }),
    enabled: settings.smsNotificationsEnabled,
    borrowerId: input.borrowerId,
  });

  await markNotificationDeliveryStatus({
    dedupeKey,
    recipient: input.guarantorPhone,
    channel: 'SMS',
    status: result.success ? 'SENT' : 'FAILED',
    failureReason: result.failureReason,
  });
}

// ─── Loan notifications ──────────────────────────────────────────────────────

export async function notifyLoanApproved(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  adminFeePesewas?: number;
  loanId: string;
  loanDisplayId: string;
  collectorUserId?: string;
}): Promise<void> {
  const settings = await getSettings();
  const adminFeePesewas = input.adminFeePesewas ?? settings.adminFeePesewas;

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'LOAN_APPROVED',
      to: input.borrowerPhone,
      body: buildLoanApprovalSmsBody({
        borrowerName: input.borrowerName,
        amountPesewas: input.amountPesewas,
        adminFeePesewas,
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
      adminFeePesewas,
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

export async function notifyLoanCreated(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
}): Promise<void> {
  const settings = await getSettings();
  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'LOAN_CREATED',
      to: input.borrowerPhone,
      body: buildLoanCreatedSmsBody({ borrowerName: input.borrowerName }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }
  if (input.borrowerEmail) {
    await dispatchEmailWhenEnabled({
      event: 'LOAN_CREATED',
      to: input.borrowerEmail,
      subject: 'WILMS loan application received',
      text: `Dear ${input.borrowerName},\n\nYour loan application (${input.loanDisplayId}) has been created and submitted for approval.\n\n— WILMS`,
      html: `<p>Dear ${input.borrowerName},</p><p>Your loan application (${input.loanDisplayId}) has been created and submitted for approval.</p>`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      category: 'loan',
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
  weeklyAmountPesewas?: number;
  paymentDay?: string;
  totalWeeks?: number;
  firstDueDate?: string;
  groupName?: string;
  collectorName?: string;
}): Promise<void> {
  const settings = await getSettings();
  const disbursedDate = input.disbursedDate ?? new Date().toISOString().slice(0, 10);
  const firstPaymentDate = input.firstDueDate ?? disbursedDate;

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'LOAN_DISBURSED',
      to: input.borrowerPhone,
      body: buildLoanDisbursedSmsBody({
        borrowerName: input.borrowerName,
        loanDisplayId: input.loanDisplayId,
        amountPesewas: input.amountPesewas,
        firstPaymentDate,
      }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });

    if (
      typeof input.weeklyAmountPesewas === 'number' &&
      input.paymentDay &&
      typeof input.totalWeeks === 'number' &&
      input.firstDueDate
    ) {
      await dispatchSms({
        event: 'SCHEDULE_GENERATED',
        to: input.borrowerPhone,
        body: buildLoanDisbursedScheduleSmsBody({
          borrowerName: input.borrowerName,
          loanDisplayId: input.loanDisplayId,
          groupName: input.groupName?.trim() || 'your group',
          collectorName: input.collectorName?.trim() || 'your collector',
          weeklyAmountPesewas: input.weeklyAmountPesewas,
          paymentDay: input.paymentDay,
          totalWeeks: input.totalWeeks,
          firstDueDate: input.firstDueDate,
        }),
        enabled: settings.smsNotificationsEnabled,
        borrowerId: input.borrowerId,
        loanId: input.loanId,
      });
    }
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
      href: `/collector/my-borrowers`,
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
  finalPaymentPesewas?: number;
  collectorUserId?: string;
}): Promise<void> {
  const settings = await getSettings();
  const finalPayment = input.finalPaymentPesewas ?? input.totalPaidPesewas;

  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'LOAN_COMPLETED',
      to: input.borrowerPhone,
      body: buildLoanCompletedSmsBody({
        borrowerName: input.borrowerName,
        paymentAmountPesewas: finalPayment,
      }),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  }

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

export async function notifyCollectorReassignedToBorrower(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  collectorName: string;
}): Promise<void> {
  const settings = await getSettings();
  if (!input.borrowerPhone) return;
  await dispatchSms({
    event: 'COLLECTOR_REASSIGNED',
    to: input.borrowerPhone,
    body: buildCollectorReassignedSmsBody({
      borrowerName: input.borrowerName,
      collectorName: input.collectorName,
    }),
    enabled: settings.smsNotificationsEnabled,
    borrowerId: input.borrowerId,
  });
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
  correlationId?: string;
}): Promise<void> {
  const { emitPaymentDueSoonNotification } = await import('./payment-notifications.js');
  await emitPaymentDueSoonNotification(input);
}

// ─── Payment notifications ───────────────────────────────────────────────────

export async function notifyPaymentReceived(input: {
  paymentId?: string;
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
  correlationId?: string;
}): Promise<void> {
  const { emitPaymentConfirmedNotification } = await import('./payment-notifications.js');
  if (!input.paymentId || !input.loanId) {
    return;
  }
  await emitPaymentConfirmedNotification({
    paymentId: input.paymentId,
    borrowerId: input.borrowerId,
    borrowerName: input.borrowerName,
    borrowerPhone: input.borrowerPhone,
    borrowerEmail: input.borrowerEmail,
    amountPesewas: input.amountPesewas,
    paymentDate: input.paymentDate,
    loanDisplayId: input.loanDisplayId,
    loanId: input.loanId,
    outstandingBalancePesewas: input.outstandingBalancePesewas,
    collectorUserId: input.collectorUserId,
    correlationId: input.correlationId,
  });
}

export async function notifyMissedPayment(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  weeksOverdue?: number;
  amountPesewas: number;
  loanId?: string;
  loanDisplayId?: string;
  dueDate?: string;
  collectorUserId?: string;
  correlationId?: string;
}): Promise<void> {
  const { emitPaymentMissedNotification } = await import('./payment-notifications.js');
  if (!input.loanId || !input.dueDate) {
    return;
  }
  await emitPaymentMissedNotification({
    borrowerId: input.borrowerId,
    borrowerName: input.borrowerName,
    borrowerPhone: input.borrowerPhone,
    borrowerEmail: input.borrowerEmail,
    loanId: input.loanId,
    loanDisplayId: input.loanDisplayId ?? input.loanId,
    dueDate: input.dueDate,
    amountPesewas: input.amountPesewas,
    collectorUserId: input.collectorUserId,
    correlationId: input.correlationId,
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

export async function notifyBorrowerUpdateApproved(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  field: string;
  afterValue: string;
}): Promise<void> {
  const settings = await getSettings();
  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'BORROWER_UPDATE_APPROVED',
      to: input.borrowerPhone,
      body: buildBorrowerUpdateApprovedSmsBody(input),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyBorrowerUpdateRejected(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  field: string;
  reviewNote?: string | null;
}): Promise<void> {
  const settings = await getSettings();
  if (input.borrowerPhone) {
    await dispatchSms({
      event: 'BORROWER_UPDATE_REJECTED',
      to: input.borrowerPhone,
      body: buildBorrowerUpdateRejectedSmsBody(input),
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
    });
  }
}
