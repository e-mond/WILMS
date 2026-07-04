import { getSettings } from '../../modules/settings/service.js';
import {
  buildBorrowerRegistrationApprovalSmsBody,
  buildMissedPaymentSmsBody,
  buildPaymentConfirmationSmsBody,
} from '../notifications/templates.js';
import { getSmsProvider } from './index.js';

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

async function sendSmsWhenEnabled(input: {
  enabled: boolean;
  to: string;
  body: string;
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
    return;
  }

  await provider.send({
    to: normalizeGhanaPhone(input.to),
    body: input.body,
  });
}

export async function maybeSendPaymentConfirmationSms(input: {
  borrowerPhone: string;
  amountPesewas: number;
  paymentDate: string;
}): Promise<void> {
  try {
    const settings = await getSettings();
    await sendSmsWhenEnabled({
      enabled: settings.smsNotificationsEnabled,
      to: input.borrowerPhone,
      body: buildPaymentConfirmationSmsBody({
        amountPesewas: input.amountPesewas,
        paymentDate: input.paymentDate,
      }),
    });
  } catch (error) {
    console.error('[sms] payment confirmation failed:', error);
  }
}

export async function maybeSendMissedPaymentSms(input: {
  borrowerPhone: string;
  borrowerName: string;
  weeksOverdue: number;
  amountPesewas: number;
}): Promise<void> {
  try {
    const settings = await getSettings();
    await sendSmsWhenEnabled({
      enabled: settings.smsNotificationsEnabled && settings.missedPaymentSmsEnabled,
      to: input.borrowerPhone,
      body: buildMissedPaymentSmsBody(input),
    });
  } catch (error) {
    console.error('[sms] missed payment alert failed:', error);
  }
}

export async function maybeSendBorrowerApprovalSms(input: {
  borrowerPhone: string;
  borrowerName: string;
}): Promise<void> {
  try {
    const settings = await getSettings();
    await sendSmsWhenEnabled({
      enabled: settings.smsNotificationsEnabled && settings.approvalSmsEnabled,
      to: input.borrowerPhone,
      body: buildBorrowerRegistrationApprovalSmsBody(input),
    });
  } catch (error) {
    console.error('[sms] borrower approval notification failed:', error);
  }
}
