import { getSmsConfig } from './config.js';
import type { SmsMessage, SmsProvider, SmsSendResult } from './types.js';

export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';

  isConfigured(): boolean {
    const config = getSmsConfig();
    return Boolean(
      config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber,
    );
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    const config = getSmsConfig();

    if (!this.isConfigured()) {
      throw new Error('Twilio SMS provider is not configured.');
    }

    const credentials = Buffer.from(
      `${config.twilio.accountSid}:${config.twilio.authToken}`,
    ).toString('base64');

    const body = new URLSearchParams({
      To: message.to,
      From: config.twilio.phoneNumber,
      Body: message.body,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Twilio API error (${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as { sid?: string };

    return {
      id: payload.sid ?? 'unknown',
      provider: this.name,
    };
  }
}
