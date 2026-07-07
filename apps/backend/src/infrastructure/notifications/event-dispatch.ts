import { env } from '../../config/env.js';
import { getSettings } from '../../modules/settings/service.js';
import { dispatchMail } from '../mail/dispatch.js';
import { getSmsProvider } from '../sms/index.js';
import {
  buildBlacklistSmsBody,
  buildBorrowerRegistrationApprovalSmsBody,
  buildLoanApprovalEmail,
  buildLoanApprovalSmsBody,
  buildLoanDisbursedSmsBody,
  buildLoanRejectedSmsBody,
  buildMissedPaymentSmsBody,
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSmsBody,
  buildRegistrationApprovedEmail,
  buildRegistrationRejectedEmail,
  buildUserInvitationEmail,
} from './templates.js';
import { logMessageDelivery } from './delivery-log.js';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 750;

function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return `233${digits.slice(1)}`;
  }
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
  if (!input.enabled || !input.to.trim()) {
    return;
  }

  const settings = await getSettings();
  if (!settings.smsNotificationsEnabled) {
    return;
  }

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
}): Promise<void> {
  if (!input.to?.trim()) {
    return;
  }

  const settings = await getSettings();
  if (!settings.emailNotificationsEnabled) {
    return;
  }

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

export async function notifyUserInvitation(input: {
  email: string;
  displayName: string;
  temporaryPassword: string;
  userId: string;
}): Promise<void> {
  const template = buildUserInvitationEmail({
    displayName: input.displayName,
    email: input.email,
    temporaryPassword: input.temporaryPassword,
    appUrl: env.appUrl,
  });

  await dispatchMail({
    event: 'USER_INVITED',
    to: input.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    userId: input.userId,
  });
}

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
      body: buildLoanRejectedSmsBody({ borrowerName: input.borrowerName }),
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

export async function notifyPaymentReceived(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  paymentDate: string;
  loanDisplayId: string;
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
    });
  }

  if (input.borrowerEmail) {
    const template = buildPaymentConfirmationEmail({
      borrowerName: input.borrowerName,
      amountPesewas: input.amountPesewas,
      paymentDate: input.paymentDate,
      loanDisplayId: input.loanDisplayId,
    });
    await dispatchEmailWhenEnabled({
      event: 'PAYMENT_RECEIVED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
    });
  }
}

export async function notifyMissedPayment(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  weeksOverdue: number;
  amountPesewas: number;
}): Promise<void> {
  const settings = await getSettings();

  if (!input.borrowerPhone) {
    return;
  }

  await dispatchSms({
    event: 'MISSED_PAYMENT',
    to: input.borrowerPhone,
    body: buildMissedPaymentSmsBody(input),
    enabled: settings.smsNotificationsEnabled && settings.missedPaymentSmsEnabled,
    borrowerId: input.borrowerId,
  });
}

export async function notifyLoanApproved(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  loanId: string;
  loanDisplayId: string;
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
}

export async function notifyLoanDisbursed(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  loanId: string;
  loanDisplayId: string;
  amountPesewas: number;
}): Promise<void> {
  const settings = await getSettings();

  if (!input.borrowerPhone) {
    return;
  }

  await dispatchSms({
    event: 'LOAN_DISBURSED',
    to: input.borrowerPhone,
    body: buildLoanDisbursedSmsBody(input),
    enabled: settings.smsNotificationsEnabled,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
  });
}
