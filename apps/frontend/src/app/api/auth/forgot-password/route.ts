import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/features/authentication/forgot-password.schema';
import { rejectInvalidCsrf } from '@/lib/auth/csrf-server';
import {
  requestPasswordResetUpstream,
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

  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Enter a valid email address.';
    return NextResponse.json({ message: firstIssue }, { status: 422 });
  }

  try {
    const result = await requestPasswordResetUpstream(parsed.data.email);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UpstreamAuthError) {
      const status = error.status === 429 ? 429 : error.status >= 500 ? 503 : 422;
      return NextResponse.json({ message: error.message }, { status });
    }

    return NextResponse.json(
      { message: 'Unable to send reset link right now. Please try again.' },
      { status: 503 },
    );
  }
}
