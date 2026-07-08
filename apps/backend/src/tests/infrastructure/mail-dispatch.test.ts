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

  it('uses Vercel relay whenever relay env is set (even with local Gmail creds)', async () => {
    process.env.MAIL_PROVIDER = 'gmail';
    process.env.WILMS_VERCEL_MAIL_URL = 'https://wilms.vercel.app';
    process.env.WILMS_INTERNAL_MAIL_SECRET = 'secret';
    process.env.GMAIL_USER = 'noreply@wilms.org';
    process.env.GMAIL_APP_PASSWORD = 'app-password';

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
    expect(fetchMock).toHaveBeenCalled();
  });

  it('rejects direct Gmail SMTP from Railway when relay is not configured', async () => {
    process.env.MAIL_PROVIDER = 'gmail';
    process.env.GMAIL_USER = 'noreply@wilms.org';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    delete process.env.WILMS_VERCEL_MAIL_URL;
    delete process.env.WILMS_INTERNAL_MAIL_SECRET;

    const { dispatchMail } = await import('../../infrastructure/mail/dispatch.js');

    await expect(
      dispatchMail({
        event: 'USER_INVITED',
        to: 'invite@example.com',
        subject: 'Invite',
        text: 'Welcome',
        html: '<p>Welcome</p>',
        enableTracking: false,
        maxRetries: 0,
      }),
    ).rejects.toThrow(/WILMS_VERCEL_MAIL_URL/);
  });
});
