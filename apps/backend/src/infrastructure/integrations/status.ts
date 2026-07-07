import { getMailConfig } from '../mail/config.js';
import { getMailProvider } from '../mail/index.js';
import { getSmsConfig } from '../sms/config.js';
import { getSmsProvider } from '../sms/index.js';

export interface IntegrationProviderStatus {
  provider: string;
  configured: boolean;
  setupHint: string;
}

export interface IntegrationStatusReport {
  sms: IntegrationProviderStatus;
  mail: IntegrationProviderStatus;
}

function resolveMailProviderLabel(): string {
  const raw = (process.env.MAIL_PROVIDER ?? 'none').toLowerCase();
  if (raw === 'gmail') {
    return 'gmail';
  }
  if (raw === 'resend') {
    return 'resend';
  }
  if (raw === 'smtp') {
    return 'smtp';
  }
  return 'none';
}

function smsSetupHint(provider: string): string {
  switch (provider) {
    case 'smsnotifygh':
      return 'Set SMS_PROVIDER=smsnotifygh, SMSNOTIFYGH_API_KEY, and SMSNOTIFYGH_SENDER_ID on Railway (see README).';
    case 'arkesel':
      return 'Set SMS_PROVIDER=arkesel, ARKESEL_API_KEY, and ARKESEL_SENDER_ID on Railway (see README).';
    case 'twilio':
      return 'Set SMS_PROVIDER=twilio, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER on Railway.';
    default:
      return 'Set SMS_PROVIDER=smsnotifygh (recommended) and provider credentials on Railway (see README).';
  }
}

function mailSetupHint(provider: string): string {
  switch (provider) {
    case 'gmail':
      return 'Set MAIL_PROVIDER=gmail, GMAIL_USER, GMAIL_APP_PASSWORD, and MAIL_FROM on Railway. For Settings → Test Email, also set GMAIL_USER and GMAIL_APP_PASSWORD on Vercel.';
    case 'resend':
      return 'Set MAIL_PROVIDER=resend, RESEND_API_KEY, and MAIL_FROM on Railway (see README).';
    case 'smtp':
      return 'Set MAIL_PROVIDER=smtp, SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and MAIL_FROM on Railway.';
    default:
      return 'Set MAIL_PROVIDER=gmail with GMAIL_USER + GMAIL_APP_PASSWORD, or MAIL_PROVIDER=resend with RESEND_API_KEY (see README).';
  }
}

export function getIntegrationStatus(): IntegrationStatusReport {
  const smsConfig = getSmsConfig();
  const mailProviderLabel = resolveMailProviderLabel();
  const mailConfig = getMailConfig();
  const sms = getSmsProvider();
  const mail = getMailProvider();

  return {
    sms: {
      provider: smsConfig.provider,
      configured: sms.isConfigured(),
      setupHint: smsSetupHint(smsConfig.provider),
    },
    mail: {
      provider: mailProviderLabel === 'none' && mailConfig.provider !== 'none' ? mailConfig.provider : mailProviderLabel,
      configured: mail.isConfigured(),
      setupHint: mailSetupHint(mailProviderLabel),
    },
  };
}
