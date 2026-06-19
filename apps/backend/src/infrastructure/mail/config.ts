export type MailProviderName = 'smtp' | 'resend' | 'none';

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
  const provider = (process.env.MAIL_PROVIDER ?? 'none').toLowerCase() as MailProviderName;
  const normalized: MailProviderName =
    provider === 'smtp' || provider === 'resend' ? provider : 'none';

  return {
    provider: normalized,
    fromAddress: process.env.MAIL_FROM?.trim() || 'noreply@wilms.local',
    smtp: {
      host: process.env.SMTP_HOST?.trim() ?? '',
      port: Number(process.env.SMTP_PORT ?? 587),
      user: process.env.SMTP_USER?.trim() ?? '',
      password: process.env.SMTP_PASSWORD?.trim() ?? '',
      secure: process.env.SMTP_SECURE === 'true',
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY?.trim() ?? '',
    },
  };
}
