import { getMailConfig } from './config.js';
import { getMailProvider } from './index.js';
import type { MailMessage, MailSendResult } from './types.js';
import { logMessageDelivery } from '../notifications/delivery-log.js';
import {
  generateTrackingToken,
  injectEmailTracking,
} from '../notifications/email-tracking.js';
import { sanitizeHtml } from '../notifications/html-sanitize.js';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 750;

function shouldUseVercelRelay(): boolean {
  const config = getMailConfig();
  const relayUrl = process.env.WILMS_VERCEL_MAIL_URL?.trim();
  const relaySecret = process.env.WILMS_INTERNAL_MAIL_SECRET?.trim();
  return Boolean(relayUrl && relaySecret && (config.provider === 'smtp' || process.env.MAIL_PROVIDER === 'gmail'));
}

async function sendViaVercelRelay(message: MailMessage): Promise<MailSendResult> {
  const relayUrl = process.env.WILMS_VERCEL_MAIL_URL!.trim().replace(/\/$/, '');
  const relaySecret = process.env.WILMS_INTERNAL_MAIL_SECRET!.trim();

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
      from: message.from,
    }),
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
  message: MailMessage,
  send: () => Promise<MailSendResult>,
): Promise<MailSendResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
      return await send();
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
}

export async function dispatchMail(input: DispatchMailInput): Promise<MailSendResult> {
  const mail = getMailProvider();
  if (!mail.isConfigured() && !shouldUseVercelRelay()) {
    throw new Error('Mail provider is not configured.');
  }

  const trackingToken =
    input.enableTracking !== false ? generateTrackingToken() : undefined;
  const sanitizedHtml = sanitizeHtml(input.html ?? '');
  const htmlWithTracking = trackingToken
    ? injectEmailTracking(sanitizedHtml, trackingToken)
    : sanitizedHtml;

  const outbound: MailMessage = {
    ...input,
    html: htmlWithTracking,
  };

  let retryAttempts = 0;

  try {
    const result = await sendWithRetries(outbound, async () => {
      if (shouldUseVercelRelay()) {
        return sendViaVercelRelay(outbound);
      }
      return mail.send(outbound);
    });

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
      retryAttempts: MAX_RETRIES,
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
      throw new Error('VALIDATION:Email relay is unavailable. Invitation has been queued for retry.');
    }

    throw new Error(`VALIDATION:Email delivery failed: ${message}`);
  }
}
