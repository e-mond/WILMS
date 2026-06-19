import { getMailConfig } from './config.js';
import type { MailMessage, MailProvider, MailSendResult } from './types.js';

export class ResendMailProvider implements MailProvider {
  readonly name = 'resend';

  isConfigured(): boolean {
    return Boolean(getMailConfig().resend.apiKey);
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const config = getMailConfig();

    if (!this.isConfigured()) {
      throw new Error('Resend mail provider is not configured.');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from ?? config.fromAddress,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as { id?: string };

    return {
      id: payload.id ?? 'unknown',
      provider: this.name,
    };
  }
}
