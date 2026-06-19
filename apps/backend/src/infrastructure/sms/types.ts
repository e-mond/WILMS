export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsSendResult {
  id: string;
  provider: string;
}

export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<SmsSendResult>;
  isConfigured(): boolean;
}
