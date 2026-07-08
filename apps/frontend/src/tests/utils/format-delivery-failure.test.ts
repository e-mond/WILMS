import { describe, expect, it } from 'vitest';
import { formatDeliveryFailure } from '@/utils/format-delivery-failure';

describe('formatDeliveryFailure', () => {
  it('maps SMTP authentication errors to readable text', () => {
    const result = formatDeliveryFailure('SMTP authentication failed for relay');
    expect(result.summary).toBe('SMTP authentication failed');
    expect(result.details).toContain('credentials');
  });

  it('maps raw JSON payloads', () => {
    const result = formatDeliveryFailure(JSON.stringify({ message: 'Invalid phone number format' }));
    expect(result.summary).toBe('Invalid phone number');
  });

  it('handles empty values', () => {
    const result = formatDeliveryFailure(null);
    expect(result.summary).toBe('Delivery failed');
  });
});
