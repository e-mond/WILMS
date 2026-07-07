import { getMailConfig } from './config.js';
import { getMailProvider } from './index.js';
import type { MailMessage, MailSendResult } from './types.js';
import { logMessageDelivery } from '../notifications/delivery-log.js';
import {
  generateTrackingToken,
  injectEmailTracking,
} from '../notifications/email-tracking.js';
import { sanitizeHtml } from '../notifications/html-sanitize.js';

const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 750;
const RELAY_FETCH_TIMEOUT_MS = 12_000;

export function isMailRelayConfigured(): boolean {
  return Boolean(
    process.env.WILMS_VERCEL_MAIL_URL?.trim() &&
      process.env.WILMS_INTERNAL_MAIL_SECRET?.trim(),
  );
}

export function isMailDeliveryConfigured(): boolean {
  return getMailProvider().isConfigured() || isMailRelayConfigured();
}

function shouldUseVercelRelay(): boolean {
  if (!isMailRelayConfigured()) {
    return false;
  }

  const rawProvider = (process.env.MAIL_PROVIDER ?? 'none').toLowerCase();
  if (rawProvider === 'gmail' || rawProvider === 'smtp') {
    return true;
  }

  const config = getMailConfig();
  if (config.provider === 'smtp') {
    return true;
  }

  // Relay-only: Gmail creds on Vercel while Railway has no outbound SMTP.
  if (!getMailProvider().isConfigured() && rawProvider !== 'resend' && rawProvider !== 'none') {
    return true;
  }

  return false;
}

async function sendViaVercelRelay(message: MailMessage): Promise<MailSendResult> {
  const relayUrl = process.env.WILMS_VERCEL_MAIL_URL!.trim().replace(/\/$/, '');
  const relaySecret = process.env.WILMS_INTERNAL_MAIL_SECRET!.trim();
  const config = getMailConfig();

  const response = await fetch(`${relayUrl}/api/mail/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Wilms-Mail-Secret': relaySecret,
    },
    body: JSON.stringify({
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      from: message.from ?? config.fromAddress,
    }),
    signal: AbortSignal.timeout(RELAY_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel mail relay failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { messageId?: string };
  return {
    id: payload.messageId ?? 'vercel-relay',
    provider: 'gmail-smtp-vercel',
  };
}

async function sendWithRetries(
  send: () => Promise<MailSendResult>,
  maxRetries: number,
): Promise<{ result: MailSendResult; retryAttempts: number }> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
      return { result: await send(), retryAttempts: attempt };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Mail delivery failed.');
}

export interface DispatchMailInput extends MailMessage {
  event: string;
  borrowerId?: string;
  loanId?: string;
  userId?: string;
  communicationMessageId?: string;
  enableTracking?: boolean;
  maxRetries?: number;
}

export async function dispatchMail(input: DispatchMailInput): Promise<MailSendResult> {
  const mail = getMailProvider();
  if (!isMailDeliveryConfigured()) {
    throw new Error('Mail provider is not configured.');
  }

  const trackingToken =
    input.enableTracking !== false ? generateTrackingToken() : undefined;
  const sanitizedHtml = sanitizeHtml(input.html ?? '');
  const htmlWithTracking = trackingToken
    ? injectEmailTracking(sanitizedHtml, trackingToken)
    : sanitizedHtml;
  const config = getMailConfig();

  const outbound: MailMessage = {
    ...input,
    from: input.from ?? config.fromAddress,
    html: htmlWithTracking,
  };

  const maxRetries = input.maxRetries ?? DEFAULT_MAX_RETRIES;

  try {
    const { result, retryAttempts } = await sendWithRetries(async () => {
      if (shouldUseVercelRelay()) {
        return sendViaVercelRelay(outbound);
      }
      return mail.send(outbound);
    }, maxRetries);

    await logMessageDelivery({
      event: input.event,
      channel: 'EMAIL',
      recipient: Array.isArray(input.to) ? input.to.join(',') : input.to,
      provider: result.provider,
      providerMessageId: result.id,
      subject: input.subject,
      bodyPreview: input.text,
      success: true,
      retryAttempts,
      trackingToken,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      userId: input.userId,
      communicationMessageId: input.communicationMessageId,
    }).catch((logError) => {
      console.error('[mail] delivery log failed after successful send:', logError);
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mail delivery failed.';
    await logMessageDelivery({
      event: input.event,
      channel: 'EMAIL',
      recipient: Array.isArray(input.to) ? input.to.join(',') : input.to,
      provider: shouldUseVercelRelay() ? 'gmail-smtp-vercel' : mail.name,
      subject: input.subject,
      bodyPreview: input.text,
      success: false,
      failureReason: message,
      retryAttempts: maxRetries,
      trackingToken,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      userId: input.userId,
      communicationMessageId: input.communicationMessageId,
    }).catch((logError) => {
      console.error('[mail] delivery log failed after send error:', logError);
    });

    if (message.includes('not configured')) {
      throw new Error('VALIDATION:Email delivery is not configured. Contact your administrator.');
    }

    if (message.includes('Vercel mail relay failed')) {
      throw new Error('VALIDATION:Email relay is unavailable. Check Vercel Gmail credentials and WILMS_INTERNAL_MAIL_SECRET.');
    }

    if (message.includes('aborted') || message.includes('timeout')) {
      throw new Error('VALIDATION:Email relay timed out. Please retry sending the invitation.');
    }

    throw new Error(`VALIDATION:Email delivery failed: ${message}`);
  }
}
