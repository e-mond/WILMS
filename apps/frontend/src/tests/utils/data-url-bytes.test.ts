import { describe, expect, it } from 'vitest';
import { estimateDataUrlBytes, MINIMAL_JPEG_DATA_URL } from '@/utils/data-url-bytes';

describe('estimateDataUrlBytes', () => {
  it('measures base64 payload length, not the data: prefix', () => {
    const bytes = estimateDataUrlBytes(MINIMAL_JPEG_DATA_URL);
    expect(bytes).toBeGreaterThan(20);
    expect(bytes).toBeLessThan(MINIMAL_JPEG_DATA_URL.length);
  });
});
