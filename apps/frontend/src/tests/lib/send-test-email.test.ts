import { describe, expect, it, vi } from 'vitest';
import { sendTestEmailViaBestRoute } from '@/lib/mail/send-test-email';
import type { IntegrationStatusReport } from '@/types/settings';

const gmailIntegration: IntegrationStatusReport = {
  sms: { provider: 'smsnotifygh', configured: true, setupHint: '' },
  mail: { provider: 'gmail', configured: true, setupHint: '' },
};

const resendIntegration: IntegrationStatusReport = {
  sms: { provider: 'smsnotifygh', configured: true, setupHint: '' },
  mail: { provider: 'resend', configured: true, setupHint: '' },
};

describe('sendTestEmailViaBestRoute', () => {
  it('uses the Vercel Gmail route for gmail providers', async () => {
    const sendViaApi = vi.fn().mockResolvedValue({ ok: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ configured: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await sendTestEmailViaBestRoute(
      'admin@example.com',
      async () => gmailIntegration,
      sendViaApi,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/mail/gmail',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(sendViaApi).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('reports when Gmail is not configured on Vercel', async () => {
    const sendViaApi = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ configured: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendTestEmailViaBestRoute(
        'admin@example.com',
        async () => gmailIntegration,
        sendViaApi,
      ),
    ).rejects.toMatchObject({ status: 422 });

    expect(sendViaApi).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('uses the Railway API route for resend providers', async () => {
    const sendViaApi = vi.fn().mockResolvedValue({ ok: true });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await sendTestEmailViaBestRoute(
      'admin@example.com',
      async () => resendIntegration,
      sendViaApi,
    );

    expect(sendViaApi).toHaveBeenCalledWith('admin@example.com');
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
