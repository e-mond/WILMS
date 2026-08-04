import { getSmsConfig } from './config.js';
import type { SmsMessage, SmsProvider, SmsSendResult } from './types.js';

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

function buildSmsApiUrl(input: {
  apiKey: string;
  to: string;
  message: string;
  senderId: string;
  baseUrl: string;
}): string {
  const url = new URL(input.baseUrl);
  url.searchParams.set('key', input.apiKey);
  url.searchParams.set('to', normalizeGhanaPhone(input.to));
  url.searchParams.set('msg', input.message);
  url.searchParams.set('sender_id', input.senderId);
  return url.toString();
}

export class SmsNotifyGhProvider implements SmsProvider {
  readonly name = 'smsnotifygh';

  isConfigured(): boolean {
    const config = getSmsConfig();
    return Boolean(config.smsnotifygh.apiKey && config.smsnotifygh.senderId);
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    const config = getSmsConfig();

    if (!this.isConfigured()) {
      throw new Error('SMSNotifyGH provider is not configured.');
    }

    const requestUrl = buildSmsApiUrl({
      apiKey: config.smsnotifygh.apiKey,
      to: message.to,
      message: message.body,
      senderId: config.smsnotifygh.senderId,
      baseUrl: config.smsnotifygh.apiUrl,
    });

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*' },
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`SMSNotifyGH API error (${response.status}): ${body}`);
    }

    try {
      const payload = JSON.parse(body) as {
        data?: { message_id?: string; id?: string };
        message_id?: string;
        id?: string;
        status?: string;
      };

      return {
        id: payload.data?.message_id ?? payload.data?.id ?? payload.message_id ?? payload.id ?? 'sent',
        provider: this.name,
      };
    } catch {
      return {
        id: body.slice(0, 64) || 'sent',
        provider: this.name,
      };
    }
  }
}

export async function fetchSmsNotifyGhBalance(): Promise<{ balance: string; raw: string }> {
  const config = getSmsConfig();

  if (!config.smsnotifygh.apiKey) {
    throw new Error('SMSNotifyGH API key is not configured.');
  }

  const balanceUrl = new URL(config.smsnotifygh.balanceUrl);
  balanceUrl.searchParams.set('key', config.smsnotifygh.apiKey);

  const response = await fetch(balanceUrl.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json, text/plain, */*' },
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`SMSNotifyGH balance error (${response.status}): ${raw}`);
  }

  try {
    const payload = JSON.parse(raw) as { balance?: string | number; data?: { balance?: string | number } };
    const balance = String(payload.balance ?? payload.data?.balance ?? raw);
    return { balance, raw };
  } catch {
    return { balance: raw, raw };
  }
}
