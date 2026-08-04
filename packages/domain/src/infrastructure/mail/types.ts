export interface MailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface MailSendResult {
  id: string;
  provider: string;
}

export interface MailProvider {
  readonly name: string;
  send(message: MailMessage): Promise<MailSendResult>;
  isConfigured(): boolean;
}
