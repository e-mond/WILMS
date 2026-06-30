import { getSettings } from '../../modules/settings/service.js';
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

export async function maybeSendPaymentConfirmationSms(input: {
  borrowerPhone: string;
  amountPesewas: number;
  paymentDate: string;
}): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings.smsNotificationsEnabled) {
      return;
    }

    const provider = getSmsProvider();
    if (!provider.isConfigured()) {
      return;
    }

    const amountGhs = (input.amountPesewas / 100).toFixed(2);
    await provider.send({
      to: normalizeGhanaPhone(input.borrowerPhone),
      body: `WILMS: Payment of GHS ${amountGhs} received on ${input.paymentDate}. Thank you.`,
    });
  } catch (error) {
    console.error('[sms] payment confirmation failed:', error);
  }
}
