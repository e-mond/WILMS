import { describe, expect, it } from 'vitest';
import { previewCommunicationTemplate } from '../../modules/communications/service.js';

describe('previewCommunicationTemplate', () => {
  it('accepts empty body text and derives plain text from html', async () => {
    const result = await previewCommunicationTemplate({
      subject: 'Hello {{firstName}}',
      bodyHtml: '<p>Payment of {{amount}} due {{dueDate}}</p>',
    });

    expect(result.subject).toContain('Ama');
    expect(result.bodyHtml).toContain('GHS 500.00');
    expect(result.bodyText).toContain('Payment of');
    expect(result.variables).toEqual(expect.arrayContaining(['firstName', 'amount', 'dueDate']));
  });

  it('uses placeholder subject when subject is omitted', async () => {
    const result = await previewCommunicationTemplate({
      bodyHtml: '<p>Reminder</p>',
    });

    expect(result.subject).toBe('(Preview)');
  });
});
