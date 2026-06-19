import { MAX_BORROWER_PHOTO_BYTES } from '@/constants/borrower-registration';

export const PHOTO_VALIDATION_MESSAGE = {
  REQUIRED: 'Passport photo is required.',
  TYPE: 'Photo must be an image file.',
  SIZE: 'Photo must be 5 MB or smaller.',
} as const;

export function validateBorrowerPhoto(file: File | null | undefined): string | null {
  if (!file) {
    return PHOTO_VALIDATION_MESSAGE.REQUIRED;
  }

  if (!file.type.startsWith('image/')) {
    return PHOTO_VALIDATION_MESSAGE.TYPE;
  }

  if (file.size > MAX_BORROWER_PHOTO_BYTES) {
    return PHOTO_VALIDATION_MESSAGE.SIZE;
  }

  return null;
}
