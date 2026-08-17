import { NextResponse } from 'next/server';
import { inspectCronAuthorization } from '@/lib/cron/authorize-cron';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Vercel Cron entry (GET). Runs payment notification jobs then communications dispatch.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` (Vercel Cron) or
 * `WILMS_SCHEDULER_TOKEN` (manual / non-Vercel). The `x-vercel-cron` header is
 * not accepted as authentication.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = inspectCronAuthorization(request);

  if (!auth.allowed) {
    console.warn('[cron/notifications] unauthorized', {
      reason: auth.reason,
      cronSecretConfigured: auth.cronSecretConfigured,
      schedulerTokenConfigured: auth.schedulerTokenConfigured,
      vercelCronHeader: request.headers.get('x-vercel-cron') === '1',
    });
    return NextResponse.json(
      { error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  try {
    const {
      processPaymentNotificationJobs,
      processScheduledMessages,
    } = await import('@wilms/domain');

    const url = new URL(request.url);
    const referenceDate = url.searchParams.get('referenceDate') ?? undefined;

    const payment = await processPaymentNotificationJobs(referenceDate ?? undefined);
    const communicationsProcessed = await processScheduledMessages();

    return NextResponse.json({
      data: {
        payment,
        communications: { processed: communicationsProcessed },
      },
    });
  } catch (error) {
    console.error('[cron/notifications] failed', error);
    return NextResponse.json(
      { error: { message: 'Scheduler run failed.', code: 'SCHEDULER_FAILED' } },
      { status: 500 },
    );
  }
}
