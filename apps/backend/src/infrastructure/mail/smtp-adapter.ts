import nodemailer from 'nodemailer';
import { getMailConfig } from './config.js';
import type { MailMessage, MailProvider, MailSendResult } from './types.js';

export class SmtpMailProvider implements MailProvider {
  readonly name = 'smtp';

  isConfigured(): boolean {
    const config = getMailConfig();
    return Boolean(config.smtp.host && config.smtp.user && config.smtp.password);
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const config = getMailConfig();

    if (!this.isConfigured()) {
      throw new Error('SMTP mail provider is not configured.');
    }

    const transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    const info = await transport.sendMail({
      from: message.from ?? config.fromAddress,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return {
      id: info.messageId,
      provider: this.name,
    };
  }
}
