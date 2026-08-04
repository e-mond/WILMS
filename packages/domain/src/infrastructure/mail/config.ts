import { formatMailFrom } from './format-from.js';

export type MailProviderName = 'smtp' | 'gmail' | 'resend' | 'none';

export interface MailConfig {
  provider: MailProviderName;
  fromAddress: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
  };
  resend: {
    apiKey: string;
  };
}

export function getMailConfig(): MailConfig {
  const rawProvider = (process.env.MAIL_PROVIDER ?? 'none').toLowerCase();
  const provider: MailProviderName =
    rawProvider === 'smtp' || rawProvider === 'gmail' || rawProvider === 'resend'
      ? (rawProvider as MailProviderName)
      : 'none';

  const gmailUser = process.env.GMAIL_USER?.trim() ?? '';
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim() ?? '';

  const smtpHost =
    process.env.SMTP_HOST?.trim() ||
    (provider === 'gmail' || gmailUser ? 'smtp.gmail.com' : '');
  const smtpUser = process.env.SMTP_USER?.trim() || gmailUser;
  const smtpPassword = process.env.SMTP_PASSWORD?.trim() || gmailAppPassword;
  const smtpPort = Number(process.env.SMTP_PORT ?? (smtpHost === 'smtp.gmail.com' ? 587 : 587));

  const rawFrom =
    process.env.MAIL_FROM?.trim() ||
    (gmailUser ? gmailUser : 'noreply@wilms.local');

  return {
    provider: provider === 'gmail' ? 'smtp' : provider,
    fromAddress: formatMailFrom(rawFrom),
    smtp: {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      password: smtpPassword,
      secure: process.env.SMTP_SECURE === 'true',
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY?.trim() ?? '',
    },
  };
}
