import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function tokenOk(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authorize(request: Request): boolean {
  const header = request.headers.get('authorization');
  const bearer = header?.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null;
  const alt = request.headers.get('x-wilms-scheduler-token')?.trim() ?? null;
  const schedulerToken = process.env.WILMS_SCHEDULER_TOKEN?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (tokenOk(bearer, schedulerToken) || tokenOk(alt, schedulerToken)) {
    return true;
  }
  if (tokenOk(bearer, cronSecret)) {
    return true;
  }
  return false;
}

/**
 * Vercel Cron entry (GET). Runs payment notification jobs then communications dispatch.
 * Auth: Authorization Bearer WILMS_SCHEDULER_TOKEN or CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  if (!authorize(request)) {
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
