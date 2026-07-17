import { describe, expect, it } from 'vitest';
import { validateAttachmentInput } from '../../infrastructure/notifications/attachment-validation.js';
import { injectEmailTracking } from '../../infrastructure/notifications/email-tracking.js';
import { sanitizeHtml } from '../../infrastructure/notifications/html-sanitize.js';
import { renderTemplate } from '../../infrastructure/notifications/template-variables.js';
import { computeNextRunAt } from '../../modules/communications/scheduler.js';

describe('html-sanitize', () => {
  it('removes script tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>');
    expect(result).toContain('<p>Hello</p>');
    expect(result).not.toContain('script');
  });

  it('keeps email style media queries inside style tags', () => {
    const html = `<!DOCTYPE html><html><head><style type="text/css">@media only screen and (max-width: 620px) { .wilms-email-shell { width: 100% !important; } }</style></head><body><p>Hello</p></body></html>`;
    const result = sanitizeHtml(html);
    expect(result).toContain('<style type="text/css">');
    expect(result).toContain('@media only screen');
    expect(result).toContain('.wilms-email-shell');
    expect(result).toContain('<p>Hello</p>');
  });
});

describe('template-variables', () => {
  it('renders known variables', () => {
    const output = renderTemplate('Hello {{firstName}}', { firstName: 'Ama' });
    expect(output).toBe('Hello Ama');
  });
});

describe('email-tracking', () => {
  it('injects pixel and rewrites links', () => {
    const html = '<p>Hi</p><a href="https://example.com">Go</a>';
    const tracked = injectEmailTracking(html, 'abc123');
    expect(tracked).toContain('/api/t/o/abc123.gif');
    expect(tracked).toContain('/api/t/c/abc123/');
  });
});

describe('attachment-validation', () => {
  it('rejects unsupported mime types', () => {
    expect(() =>
      validateAttachmentInput({ mimeType: 'application/x-msdownload', sizeBytes: 100 }),
    ).toThrow(/not allowed/);
  });
});

describe('scheduler', () => {
  it('computes daily next run', () => {
    const from = new Date('2026-07-01T10:00:00.000Z');
    const next = computeNextRunAt('DAILY', from);
    expect(next.getUTCDate()).toBe(2);
  });
});
