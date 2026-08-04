import { describe, expect, it } from 'vitest';
import { buildEmailHtml, emailButton, emailCard, resolveEmailLogoUrl } from '../../infrastructure/notifications/email-layout.js';
import {
  buildLoginOtpEmail,
  buildPasswordResetEmail,
  buildPasswordChangedEmail,
  buildVerifyEmailEmail,
  buildWelcomeEmail,
} from '../../infrastructure/notifications/templates.js';

describe('email layout engine', () => {
  it('renders branded HTML with WILMS header and logo image', () => {
    const html = buildEmailHtml({
      greeting: 'Test User',
      body: emailCard('Details', [{ label: 'Status', value: 'Active' }]),
      theme: 'success',
      logoUrl: 'https://wilms.vercel.app/icons/icon-192.png',
    });

    expect(html).toContain('WILMS');
    expect(html).toContain('Test User');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('https://wilms.vercel.app/icons/icon-192.png');
    expect(html).toContain('max-width:600px');
    expect(html).toContain('@media only screen');
    expect(html).toContain('<style type="text/css">');
  });

  it('resolves default logo URL from app base', () => {
    expect(resolveEmailLogoUrl('https://wilms.vercel.app')).toBe(
      'https://wilms.vercel.app/icons/icon-192.png',
    );
  });

  it('renders CTA buttons with correct label', () => {
    const button = emailButton('Reset Password', 'https://example.com/reset', 'info');
    expect(button).toContain('Reset Password');
    expect(button).toContain('https://example.com/reset');
  });

  it('builds password reset email with reset link', () => {
    const email = buildPasswordResetEmail({
      displayName: 'Admin User',
      resetUrl: 'https://wilms.vercel.app/reset?token=abc',
    });

    expect(email.subject).toContain('Reset');
    expect(email.html).toContain('Reset Password');
    expect(email.html).toContain('abc');
  });

  it('builds welcome email with role', () => {
    const email = buildWelcomeEmail({
      displayName: 'New Officer',
      role: 'Registration Officer',
    });

    expect(email.subject).toContain('Welcome');
    expect(email.html).toContain('Registration Officer');
  });

  it('includes mission tagline in email header', () => {
    const html = buildEmailHtml({
      greeting: 'Test',
      body: '<p>Body</p>',
    });
    expect(html).toContain('Helping women grow through interest-free financing.');
  });

  it('builds v1.3.5 security email templates', () => {
    const changed = buildPasswordChangedEmail({
      displayName: 'User',
      changedAt: '2026-07-11',
      loginUrl: 'https://wilms.vercel.app/login',
    });
    const verify = buildVerifyEmailEmail({
      displayName: 'User',
      verifyUrl: 'https://wilms.vercel.app/verify',
    });
    expect(changed.subject).toContain('password');
    expect(verify.html).toContain('Verify Email');
  });

  it('builds branded login OTP email with code block', () => {
    const otp = buildLoginOtpEmail({
      displayName: 'Ama Boateng',
      code: '482913',
    });

    expect(otp.subject).toContain('sign-in code');
    expect(otp.html).toContain('482913');
    expect(otp.html).toContain('<!DOCTYPE html>');
    expect(otp.html).toContain('Verification code');
    expect(otp.text).toContain('482913');
  });
});
