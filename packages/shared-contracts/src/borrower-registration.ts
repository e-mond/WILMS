export const BORROWER_GENDER = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
  OTHER: 'OTHER',
} as const;

export type BorrowerGender = (typeof BORROWER_GENDER)[keyof typeof BORROWER_GENDER];

export const BORROWER_ID_TYPE = {
  GHANA_CARD: 'GHANA_CARD',
  VOTER_ID: 'VOTER_ID',
  PASSPORT: 'PASSPORT',
} as const;

export type BorrowerIdType = (typeof BORROWER_ID_TYPE)[keyof typeof BORROWER_ID_TYPE];

export const MAX_BORROWER_PHOTO_BYTES = 5 * 1024 * 1024;
