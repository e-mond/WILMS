import { NextResponse } from 'next/server';
import { getGmailSmtpConfig, sendGmailSmtpMessage } from '@/lib/mail/gmail-smtp';

export const runtime = 'nodejs';

/** Server-side Gmail SMTP health check for Next.js deployments. */
export async function GET() {
  const config = getGmailSmtpConfig();
  return NextResponse.json({
    configured: Boolean(config),
    provider: 'gmail-smtp',
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 422 });
  }

  try {
    const result = await sendGmailSmtpMessage({
      to: email,
      subject: 'WILMS Gmail SMTP test',
      text: 'This is a test email sent from the WILMS Next.js Gmail SMTP route.',
      html: '<p>This is a test email sent from the <strong>WILMS</strong> Next.js Gmail SMTP route.</p>',
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gmail SMTP send failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
