import { NextResponse } from 'next/server';
import { loginSchema } from '@/features/authentication/login.schema';
import { authenticateCredentials } from '@/lib/auth/authenticate';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/cookies';
import { encodeSessionPayload, toAuthSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 422 });
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Please check your login details.';
    return NextResponse.json({ message: firstIssue }, { status: 422 });
  }

  const sessionPayload = await authenticateCredentials(parsed.data);

  if (!sessionPayload) {
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
  }

  const session = toAuthSession(sessionPayload);
  const response = NextResponse.json({
    user: session.user,
    expiresAt: session.expiresAt,
  });

  response.cookies.set(
    SESSION_COOKIE_NAME,
    encodeSessionPayload(sessionPayload),
    getSessionCookieOptions(),
  );

  return response;
}
