import { afterEach, describe, expect, it, vi } from 'vitest';

describe('mail dispatch configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('treats Vercel relay as configured mail delivery', async () => {
    process.env.MAIL_PROVIDER = 'gmail';
    process.env.WILMS_VERCEL_MAIL_URL = 'https://wilms.vercel.app';
    process.env.WILMS_INTERNAL_MAIL_SECRET = 'secret';
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const { isMailDeliveryConfigured } = await import('../../infrastructure/mail/dispatch.js');
    expect(isMailDeliveryConfigured()).toBe(true);
  });

  it('uses Vercel relay for gmail provider without local SMTP credentials', async () => {
    process.env.MAIL_PROVIDER = 'gmail';
    process.env.WILMS_VERCEL_MAIL_URL = 'https://wilms.vercel.app';
    process.env.WILMS_INTERNAL_MAIL_SECRET = 'secret';
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'relay-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { dispatchMail } = await import('../../infrastructure/mail/dispatch.js');
    const result = await dispatchMail({
      event: 'USER_INVITED',
      to: 'invite@example.com',
      subject: 'Invite',
      text: 'Welcome',
      html: '<p>Welcome</p>',
      enableTracking: false,
      maxRetries: 0,
    });

    expect(result.provider).toBe('gmail-smtp-vercel');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://wilms.vercel.app/api/mail/send',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
