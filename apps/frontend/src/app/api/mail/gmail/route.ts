import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { rejectInvalidCsrf } from '@/lib/auth/csrf-server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const maxDuration = 30;

function resolveApiUpstream(): string {
  const upstream = process.env.WILMS_API_UPSTREAM?.trim();
  if (upstream) {
    return upstream.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('WILMS_API_UPSTREAM is required in production');
  }
  return 'http://127.0.0.1:4000';
}

interface VerifiedSessionUser {
  displayName?: string;
  role?: string;
}

/**
 * Verify the session cookie against the API (HMAC-signed token).
 * Never trust decode-only frontend parsing for side-effect routes.
 */
async function verifySessionWithUpstream(
  sessionToken: string,
): Promise<VerifiedSessionUser | null> {
  try {
    const response = await fetch(`${resolveApiUpstream()}/auth/session`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      data?: {
        authenticated?: boolean;
        session?: { displayName?: string; role?: string } | null;
      };
    };

    if (!json.data?.authenticated || !json.data.session) {
      return null;
    }

    return {
      displayName: json.data.session.displayName,
      role: json.data.session.role,
    };
  } catch {
    return null;
  }
}

async function assertCanManageSettings(sessionToken: string): Promise<VerifiedSessionUser | null> {
  const session = await verifySessionWithUpstream(sessionToken);
  if (!session) {
    return null;
  }

  // Prefer settings/me which already requires a valid session; permission checked via integrations.
  try {
    const response = await fetch(`${resolveApiUpstream()}/api/v1/settings/integrations/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (response.status === 403 || response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/** Server-side Gmail SMTP test — runs on Vercel where outbound SMTP is reachable. */
export async function GET() {
  const configReady = Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim(),
  );
  return NextResponse.json({
    configured: configReady,
    provider: 'gmail-smtp',
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
  });
}

export async function POST(request: Request) {
  const csrfFailure = rejectInvalidCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return NextResponse.json(
      { error: 'You do not have permission to send test emails.' },
      { status: 403 },
    );
  }

  const session = await assertCanManageSettings(sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: 'You do not have permission to send test emails.' },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 422 });
  }

  try {
    const { sendGmailSmtpMessage } = await import('@/lib/mail/gmail-smtp');
    const result = await sendGmailSmtpMessage({
      to: email,
      subject: 'WILMS test email',
      text: `Hello ${session.displayName ?? 'admin'}, this is a test email from WILMS (Gmail SMTP).`,
      html: `<p>Hello <strong>${session.displayName ?? 'admin'}</strong>,</p><p>This is a test email from WILMS (Gmail SMTP).</p>`,
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gmail SMTP send failed.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
