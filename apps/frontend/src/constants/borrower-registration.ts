export {
  BORROWER_GENDER,
  BORROWER_ID_TYPE,
  MAX_BORROWER_PHOTO_BYTES,
  type BorrowerGender,
  type BorrowerIdType,
} from '@wilms/shared-contracts';

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'Oti',
  'North East',
  'Savannah',
] as const;

export const TYPE_OF_WORK_OPTIONS = [
  'Trader',
  'Farmer',
  'Seamstress',
  'Food Vendor',
  'Hairdresser',
  'Artisan',
  'Other',
] as const;

export const REGISTRATION_ADDRESS_MIN_LENGTH = 5;
export const REGISTRATION_ADDRESS_MAX_LENGTH = 200;
export const REGISTRATION_GPS_MAX_ACCURACY_METERS = 150;

export const GUARANTOR_RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Sibling',
  'Parent',
  'Friend',
  'Colleague',
  'Other',
] as const;

export const REGISTRATION_STEP_LABELS = [
  'Personal Details',
  'Address',
  'Business Info',
  'Guarantor',
  'Photo',
  'Signatures',
  'Review',
] as const;
