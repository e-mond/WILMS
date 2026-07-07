import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PERMISSION, roleHasPermission } from '@wilms/shared-rbac';
import { rejectInvalidCsrf } from '@/lib/auth/csrf-server';
import { SESSION_COOKIE_NAME, parseSessionCookie } from '@/lib/auth/session';
import { getGmailSmtpConfig, sendGmailSmtpMessage } from '@/lib/mail/gmail-smtp';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Server-side Gmail SMTP test — runs on Vercel where outbound SMTP is reachable. */
export async function GET() {
  const config = getGmailSmtpConfig();
  return NextResponse.json({
    configured: Boolean(config),
    provider: 'gmail-smtp',
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
  });
}

export async function POST(request: Request) {
  const csrfFailure = rejectInvalidCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  const session = parseSessionCookie(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!session || !roleHasPermission(session.user.role, PERMISSION.MANAGE_SYSTEM_SETTINGS)) {
    return NextResponse.json({ error: 'You do not have permission to send test emails.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 422 });
  }

  try {
    const result = await sendGmailSmtpMessage({
      to: email,
      subject: 'WILMS test email',
      text: `Hello ${session.user.displayName ?? 'admin'}, this is a test email from WILMS (Gmail SMTP).`,
      html: `<p>Hello <strong>${session.user.displayName ?? 'admin'}</strong>,</p><p>This is a test email from WILMS (Gmail SMTP).</p>`,
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gmail SMTP send failed.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
