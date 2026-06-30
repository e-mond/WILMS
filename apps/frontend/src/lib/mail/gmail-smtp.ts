import 'server-only';
import nodemailer from 'nodemailer';

export interface GmailSmtpConfig {
  user: string;
  appPassword: string;
  from: string;
}

export function getGmailSmtpConfig(): GmailSmtpConfig | null {
  const user = process.env.GMAIL_USER?.trim() ?? process.env.SMTP_USER?.trim() ?? '';
  const appPassword =
    process.env.GMAIL_APP_PASSWORD?.trim() ?? process.env.SMTP_PASSWORD?.trim() ?? '';

  if (!user || !appPassword) {
    return null;
  }

  return {
    user,
    appPassword,
    from: process.env.MAIL_FROM?.trim() || user,
  };
}

export async function sendGmailSmtpMessage(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ messageId: string }> {
  const config = getGmailSmtpConfig();
  if (!config) {
    throw new Error('Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: config.user,
      pass: config.appPassword,
    },
  });

  const info = await transport.sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { messageId: info.messageId };
}
