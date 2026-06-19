import { getMailConfig } from './config.js';
import { ResendMailProvider } from './resend-adapter.js';
import { SmtpMailProvider } from './smtp-adapter.js';
import type { MailProvider } from './types.js';

export type { MailMessage, MailProvider, MailSendResult } from './types.js';
export { getMailConfig } from './config.js';

class NoopMailProvider implements MailProvider {
  readonly name = 'none';

  isConfigured(): boolean {
    return false;
  }

  async send(): Promise<never> {
    throw new Error('Mail provider is not configured. Set MAIL_PROVIDER and credentials.');
  }
}

let mailProviderInstance: MailProvider | null = null;

export function getMailProvider(): MailProvider {
  if (mailProviderInstance) {
    return mailProviderInstance;
  }

  const config = getMailConfig();

  if (config.provider === 'resend') {
    mailProviderInstance = new ResendMailProvider();
    return mailProviderInstance;
  }

  if (config.provider === 'smtp') {
    mailProviderInstance = new SmtpMailProvider();
    return mailProviderInstance;
  }

  mailProviderInstance = new NoopMailProvider();
  return mailProviderInstance;
}
