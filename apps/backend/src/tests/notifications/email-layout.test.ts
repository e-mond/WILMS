import { describe, expect, it } from 'vitest';
import { buildEmailHtml, emailButton, emailCard } from '../../infrastructure/notifications/email-layout.js';
import { buildPasswordResetEmail, buildWelcomeEmail } from '../../infrastructure/notifications/templates.js';

describe('email layout engine', () => {
  it('renders branded HTML with WILMS header', () => {
    const html = buildEmailHtml({
      greeting: 'Test User',
      body: emailCard('Details', [{ label: 'Status', value: 'Active' }]),
      theme: 'success',
    });

    expect(html).toContain('WILMS');
    expect(html).toContain('Test User');
    expect(html).toContain('<!DOCTYPE html>');
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
});
