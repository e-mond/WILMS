import { csrfHeaders } from '@/lib/auth/csrf';
import { ensureCsrfToken } from '@/services/authService';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import type { IntegrationStatusReport } from '@/types/settings';

function shouldUseVercelGmailRoute(integration: IntegrationStatusReport): boolean {
  const provider = integration.mail.provider;
  return provider === 'gmail' || provider === 'smtp';
}

async function sendGmailTestEmailViaVercel(email: string): Promise<{ ok: true }> {
  const statusResponse = await fetch('/api/mail/gmail', { credentials: 'include' });
  const status = (await statusResponse.json().catch(() => ({}))) as { configured?: boolean };

  if (!status.configured) {
    throw new ApiError(
      'Gmail SMTP is not configured on Vercel. Add GMAIL_USER and GMAIL_APP_PASSWORD to the Vercel project environment (test email sends from Vercel because Railway blocks outbound SMTP).',
      API_ERROR_CODE.VALIDATION,
      422,
    );
  }

  await ensureCsrfToken();

  const response = await fetch('/api/mail/gmail', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let message = 'Gmail SMTP test failed.';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // ignore parse errors
    }

    if (response.status === 403) {
      throw new ApiError(message, API_ERROR_CODE.FORBIDDEN, 403);
    }

    if (response.status === 422) {
      throw new ApiError(message, API_ERROR_CODE.VALIDATION, 422);
    }

    throw new ApiError(message, API_ERROR_CODE.SERVER, response.status);
  }

  return { ok: true };
}

export async function sendTestEmailViaBestRoute(
  email: string,
  getIntegrationStatus: () => Promise<IntegrationStatusReport>,
  sendViaApi: (email: string) => Promise<{ ok: true }>,
): Promise<{ ok: true }> {
  const integration = await getIntegrationStatus();

  if (shouldUseVercelGmailRoute(integration)) {
    return sendGmailTestEmailViaVercel(email);
  }

  return sendViaApi(email);
}
