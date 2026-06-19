import { describe, expect, it } from 'vitest';
import { MAX_BORROWER_PHOTO_BYTES } from '@/constants/borrower-registration';
import {
  PHOTO_VALIDATION_MESSAGE,
  validateBorrowerPhoto,
} from '@/utils/photo-validation';

describe('validateBorrowerPhoto', () => {
  it('requires a file', () => {
    expect(validateBorrowerPhoto(null)).toBe(PHOTO_VALIDATION_MESSAGE.REQUIRED);
  });

  it('accepts valid image files', () => {
    const photo = new File(['image'], 'passport.jpg', { type: 'image/jpeg' });
    expect(validateBorrowerPhoto(photo)).toBeNull();
  });

  it('rejects non-image files', () => {
    const document = new File(['text'], 'notes.txt', { type: 'text/plain' });
    expect(validateBorrowerPhoto(document)).toBe(PHOTO_VALIDATION_MESSAGE.TYPE);
  });

  it('rejects files larger than 5 MB', () => {
    const oversized = new File(
      [new Uint8Array(MAX_BORROWER_PHOTO_BYTES + 1)],
      'large.jpg',
      { type: 'image/jpeg' },
    );

    expect(validateBorrowerPhoto(oversized)).toBe(PHOTO_VALIDATION_MESSAGE.SIZE);
  });
});
