import { NextResponse } from 'next/server';
import { getGmailSmtpConfig, sendGmailSmtpMessage } from '@/lib/mail/gmail-smtp';

export const runtime = 'nodejs';
export const maxDuration = 30;

function isAuthorized(request: Request): boolean {
  const expected = process.env.WILMS_INTERNAL_MAIL_SECRET?.trim();
  if (!expected) {
    return false;
  }

  const provided = request.headers.get('x-wilms-mail-secret')?.trim();
  return Boolean(provided && provided === expected);
}

/** Server-to-server Gmail SMTP relay for Railway API mail dispatch. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized mail relay request.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
  };

  const email = (typeof body.to === 'string' ? body.to : body.email)?.trim() ?? '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body.text === 'string' ? body.text : '';
  const html = typeof body.html === 'string' ? body.html : undefined;

  if (!email || !subject || !text) {
    return NextResponse.json({ error: 'to, subject, and text are required.' }, { status: 422 });
  }

  const config = getGmailSmtpConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Gmail SMTP is not configured on Vercel. Set GMAIL_USER and GMAIL_APP_PASSWORD.' },
      { status: 422 },
    );
  }

  try {
    const result = await sendGmailSmtpMessage({
      to: email,
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gmail SMTP send failed.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
