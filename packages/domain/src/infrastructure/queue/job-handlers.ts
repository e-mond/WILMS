/**
 * Register built-in job handlers for mail/SMS/scheduler/outbox.
 * Mail/SMS still execute via existing dispatch adapters — queue provides durability/retry.
 */
import { dispatchMail } from '../mail/dispatch.js';
import { getSmsProvider } from '../sms/index.js';
import { registerOutboxHandlers } from '../outbox/publisher.js';
import { logger } from '../logging/logger.js';
import { registerJobHandler } from './index.js';

export function registerBuiltInJobHandlers(): void {
  registerJobHandler('mail.send', async (job) => {
    const payload = job.payload as {
      to: string | string[];
      subject: string;
      text?: string;
      html?: string;
      event?: string;
    };
    const result = await dispatchMail({
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      event: payload.event ?? 'queued.mail',
    });
    logger.info('queue.job.mail.send.ok', {
      correlationId: job.correlationId,
      provider: result.provider,
    });
  });

  registerJobHandler('sms.send', async (job) => {
    const phone = String(job.payload.phone ?? '');
    const body = String(job.payload.body ?? '');
    if (!phone || !body) {
      throw new Error('sms.send requires phone and body');
    }
    await getSmsProvider().send({ to: phone, body });
  });

  registerJobHandler('scheduler.tick', async (job) => {
    logger.info('queue.job.scheduler.tick', {
      correlationId: job.correlationId,
      payload: job.payload,
    });
  });

  registerJobHandler('export.run', async (job) => {
    logger.info('queue.job.export.run', {
      correlationId: job.correlationId,
      exportType: job.payload.exportType,
    });
  });

  registerOutboxHandlers();
}
