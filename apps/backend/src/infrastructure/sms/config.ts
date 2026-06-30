export type SmsProviderName = 'arkesel' | 'twilio' | 'smsnotifygh' | 'none';

export interface SmsConfig {
  provider: SmsProviderName;
  arkesel: {
    apiKey: string;
    senderId: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  smsnotifygh: {
    apiKey: string;
    senderId: string;
    apiUrl: string;
    balanceUrl: string;
  };
}

export function getSmsConfig(): SmsConfig {
  const provider = (process.env.SMS_PROVIDER ?? 'none').toLowerCase() as SmsProviderName;
  const normalized: SmsProviderName =
    provider === 'arkesel' || provider === 'twilio' || provider === 'smsnotifygh'
      ? provider
      : 'none';

  return {
    provider: normalized,
    arkesel: {
      apiKey: process.env.ARKESEL_API_KEY?.trim() ?? '',
      senderId: process.env.ARKESEL_SENDER_ID?.trim() ?? '',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN?.trim() ?? '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER?.trim() ?? '',
    },
    smsnotifygh: {
      apiKey: process.env.SMSNOTIFYGH_API_KEY?.trim() ?? '',
      senderId: process.env.SMSNOTIFYGH_SENDER_ID?.trim() ?? '',
      apiUrl:
        process.env.SMSNOTIFYGH_API_URL?.trim() ?? 'https://sms.smsnotifygh.com/smsapi',
      balanceUrl:
        process.env.SMSNOTIFYGH_BALANCE_URL?.trim() ??
        'https://sms.smsnotifygh.com/api/balance/sms',
    },
  };
}
