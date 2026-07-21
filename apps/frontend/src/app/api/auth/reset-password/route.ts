import { NextResponse } from 'next/server';
import { rejectInvalidCsrf } from '@/lib/auth/csrf-server';
import {
  resetPasswordWithTokenUpstream,
  UpstreamAuthError,
} from '@/lib/auth/password-reset-upstream';

export async function POST(request: Request) {
  const csrfFailure = rejectInvalidCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 422 });
  }

  const payload = body as { token?: unknown; newPassword?: unknown };
  const token = typeof payload.token === 'string' ? payload.token : '';
  const newPassword = typeof payload.newPassword === 'string' ? payload.newPassword : '';

  if (!token.trim()) {
    return NextResponse.json({ message: 'Reset token is required.' }, { status: 422 });
  }

  if (!newPassword || newPassword.length < 10) {
    return NextResponse.json(
      { message: 'Password must be at least 10 characters.' },
      { status: 422 },
    );
  }

  try {
    const result = await resetPasswordWithTokenUpstream(token.trim(), newPassword);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UpstreamAuthError) {
      const status = error.status >= 500 ? 503 : 422;
      return NextResponse.json({ message: error.message }, { status });
    }

    return NextResponse.json(
      { message: 'Unable to reset password right now. Please try again.' },
      { status: 503 },
    );
  }
}
