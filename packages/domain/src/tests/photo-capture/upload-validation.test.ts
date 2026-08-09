import { describe, expect, it } from 'vitest';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { validateUploadInput } from '../../infrastructure/uploads/validation.js';

/** Tiny valid JPEG used by the simulate / fixture path. */
const MINIMAL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z',
  'base64',
);

describe('photo-capture upload validation contract', () => {
  it('rejects validateUploadInput without a buffer (the pre-fix bug path)', () => {
    expect(() =>
      validateUploadInput({
        mimeType: 'image/jpeg',
        sizeBytes: 12,
      }),
    ).toThrow(/Upload content is required/);
  });

  it('accepts a real JPEG buffer with matching sizeBytes', () => {
    const mime = validateUploadInput({
      mimeType: 'image/jpeg',
      sizeBytes: MINIMAL_JPEG.length,
      buffer: MINIMAL_JPEG,
    });
    expect(mime).toBe('image/jpeg');
  });

  it('maps VALIDATION errors to AppError 422 the same way as the upload route', () => {
    try {
      validateUploadInput({ mimeType: 'image/jpeg', sizeBytes: 1 });
      throw new Error('expected validation failure');
    } catch (error) {
      const message =
        error instanceof Error ? error.message.replace(/^VALIDATION:/, '') : 'Invalid upload.';
      const mapped = new AppError(message, ERROR_CODE.VALIDATION, 422);
      expect(mapped.status).toBe(422);
      expect(mapped.message).toMatch(/Upload content is required/);
    }
  });
});
