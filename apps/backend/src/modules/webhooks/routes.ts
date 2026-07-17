import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { updateDeliveryFromWebhook } from '../../infrastructure/notifications/email-tracking.js';

export const webhooksRouter = Router();

function verifyResendSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature.replace('sha256=', '')));
  } catch {
    return false;
  }
}

function mapResendEvent(type: string): 'DELIVERED' | 'BOUNCED' | 'COMPLAINED' | 'FAILED' | 'DEFERRED' | null {
  switch (type) {
    case 'email.delivered':
      return 'DELIVERED';
    case 'email.bounced':
      return 'BOUNCED';
    case 'email.complained':
      return 'COMPLAINED';
    case 'email.delivery_delayed':
      return 'DEFERRED';
    case 'email.failed':
      return 'FAILED';
    default:
      return null;
  }
}

webhooksRouter.post(
  '/webhooks/mail/resend',
  asyncHandler(async (req, res) => {
    const rawBody = JSON.stringify(req.body);
    const signature = req.get('resend-signature') ?? req.get('x-resend-signature') ?? undefined;
    const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();

    if (!secret) {
      res.status(503).json({ error: 'Resend webhook is not configured.' });
      return;
    }

    if (!verifyResendSignature(rawBody, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const payload = req.body as {
      type?: string;
      data?: { email_id?: string; bounce?: { message?: string } };
    };

    const status = payload.type ? mapResendEvent(payload.type) : null;
    if (status && payload.data?.email_id) {
      await updateDeliveryFromWebhook({
        providerMessageId: payload.data.email_id,
        status,
        reason: payload.data.bounce?.message,
      });
    }

    sendData(res, { ok: true });
  }),
);

webhooksRouter.post(
  '/webhooks/mail/generic',
  asyncHandler(async (req, res) => {
    const secret = process.env.MAIL_WEBHOOK_SECRET?.trim();
    if (!secret) {
      res.status(503).json({ error: 'Generic mail webhook is not configured.' });
      return;
    }

    const provided =
      req.get('x-wilms-webhook-secret') ??
      req.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      '';

    if (!provided || provided !== secret) {
      res.status(401).json({ error: 'Invalid webhook secret' });
      return;
    }

    const payload = req.body as {
      provider?: string;
      messageId?: string;
      event?: string;
      reason?: string;
    };

    const event = (payload.event ?? '').toLowerCase();
    let status: 'DELIVERED' | 'BOUNCED' | 'COMPLAINED' | 'FAILED' | 'DEFERRED' | null = null;

    if (event.includes('deliver')) status = 'DELIVERED';
    if (event.includes('bounce')) status = 'BOUNCED';
    if (event.includes('complain') || event.includes('spam')) status = 'COMPLAINED';
    if (event.includes('fail')) status = 'FAILED';
    if (event.includes('defer')) status = 'DEFERRED';

    if (status && payload.messageId) {
      await updateDeliveryFromWebhook({
        providerMessageId: payload.messageId,
        status,
        reason: payload.reason,
      });
    }

    sendData(res, { ok: true, provider: payload.provider ?? 'generic' });
  }),
);
