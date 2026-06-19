import { getSmsConfig } from './config.js';
import { ArkeselSmsProvider } from './arkesel-adapter.js';
import { TwilioSmsProvider } from './twilio-adapter.js';
import type { SmsProvider } from './types.js';

export type { SmsMessage, SmsProvider, SmsSendResult } from './types.js';
export { getSmsConfig } from './config.js';

class NoopSmsProvider implements SmsProvider {
  readonly name = 'none';

  isConfigured(): boolean {
    return false;
  }

  async send(): Promise<never> {
    throw new Error('SMS provider is not configured. Set SMS_PROVIDER and credentials.');
  }
}

let smsProviderInstance: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (smsProviderInstance) {
    return smsProviderInstance;
  }

  const config = getSmsConfig();

  if (config.provider === 'arkesel') {
    smsProviderInstance = new ArkeselSmsProvider();
    return smsProviderInstance;
  }

  if (config.provider === 'twilio') {
    smsProviderInstance = new TwilioSmsProvider();
    return smsProviderInstance;
  }

  smsProviderInstance = new NoopSmsProvider();
  return smsProviderInstance;
}
