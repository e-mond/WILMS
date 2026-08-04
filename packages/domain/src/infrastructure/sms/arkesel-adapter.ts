import { getSmsConfig } from './config.js';
import type { SmsMessage, SmsProvider, SmsSendResult } from './types.js';

export class ArkeselSmsProvider implements SmsProvider {
  readonly name = 'arkesel';

  isConfigured(): boolean {
    const config = getSmsConfig();
    return Boolean(config.arkesel.apiKey && config.arkesel.senderId);
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    const config = getSmsConfig();

    if (!this.isConfigured()) {
      throw new Error('Arkesel SMS provider is not configured.');
    }

    const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': config.arkesel.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: config.arkesel.senderId,
        message: message.body,
        recipients: [message.to],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Arkesel API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as { data?: { message_id?: string } };

    return {
      id: payload.data?.message_id ?? 'unknown',
      provider: this.name,
    };
  }
}
