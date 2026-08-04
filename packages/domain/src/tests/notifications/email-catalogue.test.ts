import { describe, expect, it } from 'vitest';
import { EMAIL_TEMPLATE_CATALOGUE, EMAIL_TEMPLATE_VARIABLES, listAllEmailTemplates } from '../../infrastructure/notifications/email-catalogue.js';

describe('email-catalogue', () => {
  it('lists all templates across categories', () => {
    const templates = listAllEmailTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(30);
    expect(templates.some((t) => t.id === 'login-alert')).toBe(true);
    expect(templates.some((t) => t.id === 'password-changed')).toBe(true);
    expect(templates.some((t) => t.id === 'announcement')).toBe(true);
  });

  it('documents reusable template variables', () => {
    expect(EMAIL_TEMPLATE_VARIABLES).toContain('firstName');
    expect(EMAIL_TEMPLATE_VARIABLES).toContain('loanNumber');
    expect(EMAIL_TEMPLATE_VARIABLES).toContain('dueDate');
  });

  it('covers authentication workflows', () => {
    const authIds = EMAIL_TEMPLATE_CATALOGUE.authentication.map((t) => t.id);
    expect(authIds).toContain('welcome');
    expect(authIds).toContain('verify-email');
    expect(authIds).toContain('password-reset');
    expect(authIds).toContain('login-alert');
    expect(authIds).toContain('invitation-accepted');
    expect(authIds).toContain('invitation-expired');
  });
});
