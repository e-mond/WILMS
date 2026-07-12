import { z } from 'zod';
import { validateBorrowerId } from '@wilms/shared-validation';
import {
  BORROWER_GENDER,
  BORROWER_ID_TYPE,
  MAX_BORROWER_PHOTO_BYTES,
} from '@/constants/borrower-registration';

const MIN_BORROWER_AGE_YEARS = 20;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxBorrowerDateOfBirthIso(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - MIN_BORROWER_AGE_YEARS);
  return date.toISOString().slice(0, 10);
}

export const MAX_BORROWER_DATE_OF_BIRTH = maxBorrowerDateOfBirthIso();
export const MAX_DATE_OF_BIRTH_TODAY = todayIsoDate();

function requiredSelection<T extends readonly [string, ...string[]]>(
  values: T,
  message: string,
) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value): value is T[number] => values.includes(value as T[number]), {
      message,
    });
}

const dateOfBirthSchema = z
  .string()
  .min(1, 'Date of birth is required.')
  .refine((value) => !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime()), {
    message: 'Enter a valid date of birth.',
  })
  .refine((value) => value <= todayIsoDate(), {
    message: 'Date of birth cannot be in the future.',
  })
  .refine((value) => value <= maxBorrowerDateOfBirthIso(), {
    message: 'Borrower must be at least 20 years old.',
  });

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required.')
  .regex(/^(\+233|0)\d{9}$/, 'Enter a valid Ghana phone number (+233 or 0 prefix).');

function refineBorrowerId(
  ctx: z.RefinementCtx,
  idType: string | undefined,
  idNumber: string | undefined,
  path: 'idNumber' | 'guarantorIdNumber',
) {
  if (!idType || !idNumber?.trim()) {
    return;
  }

  const validation = validateBorrowerId(idType, idNumber);
  if (!validation.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: validation.error ?? 'Invalid ID number.',
      path: [path],
    });
  }
}

const personalDetailsBaseSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  dateOfBirth: dateOfBirthSchema,
  gender: requiredSelection(
    [BORROWER_GENDER.FEMALE, BORROWER_GENDER.MALE, BORROWER_GENDER.OTHER] as const,
    'Please select your gender.',
  ),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Enter a valid email address.',
    }),
  nationality: z.string().trim().min(1, 'Nationality is required.'),
  idType: requiredSelection(
    [BORROWER_ID_TYPE.GHANA_CARD, BORROWER_ID_TYPE.VOTER_ID, BORROWER_ID_TYPE.PASSPORT] as const,
    'Please select an ID type.',
  ),
  idNumber: z.string().trim().min(1, 'Please provide your ID number.'),
  idDocument: z.instanceof(File).nullable().optional(),
  idDocumentUploadId: z.string().optional(),
});

export const personalDetailsSchema = personalDetailsBaseSchema.superRefine((data, ctx) => {
  refineBorrowerId(ctx, data.idType, data.idNumber, 'idNumber');
});

export const addressSchema = z.object({
  houseAddress: z.string().trim().min(1, 'House address is required.'),
  gpsAddress: z.string().trim().min(1, 'GPS address is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  region: z.string().trim().min(1, 'Region is required.'),
  district: z.string().trim().min(1, 'District is required.'),
});

export const businessSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required.'),
  businessAddress: z.string().trim().min(1, 'Business address is required.'),
  typeOfWork: z.string().trim().min(1, 'Type of work is required.'),
  typeOfWorkOther: z.string().trim().optional(),
});

const guarantorBaseSchema = z.object({
  guarantorName: z.string().trim().min(1, 'Guarantor full name is required.'),
  guarantorPhone: phoneSchema,
  guarantorRelationship: z.string().trim().min(1, 'Relationship is required.'),
  guarantorIdType: requiredSelection(
    [BORROWER_ID_TYPE.GHANA_CARD, BORROWER_ID_TYPE.VOTER_ID, BORROWER_ID_TYPE.PASSPORT] as const,
    'Please select guarantor ID type.',
  ),
  guarantorIdNumber: z.string().trim().min(1, 'Please provide guarantor ID number.'),
  guarantorPhoto: z
    .instanceof(File, { message: 'Guarantor passport photo is required.' })
    .refine((file) => file.type.startsWith('image/'), 'Guarantor photo must be an image file.')
    .refine(
      (file) => file.size <= MAX_BORROWER_PHOTO_BYTES,
      'Guarantor photo must be 5 MB or smaller.',
    ),
  guarantorPhotoUploadId: z.string().optional(),
});

export const guarantorSchema = guarantorBaseSchema.superRefine((data, ctx) => {
  refineBorrowerId(ctx, data.guarantorIdType, data.guarantorIdNumber, 'guarantorIdNumber');
});

export const photoSchema = z.object({
  photo: z
    .instanceof(File, { message: 'Passport photo is required.' })
    .refine((file) => file.type.startsWith('image/'), 'Photo must be an image file.')
    .refine(
      (file) => file.size <= MAX_BORROWER_PHOTO_BYTES,
      'Photo must be 5 MB or smaller.',
    ),
  photoUploadId: z.string().optional(),
});

const optionalUploadId = z.string().optional();

export const signatureSchema = z.object({
  borrowerSignatureUploadId: optionalUploadId,
  borrowerThumbprintUploadId: optionalUploadId,
  guarantorSignatureUploadId: optionalUploadId,
  guarantorThumbprintUploadId: optionalUploadId,
  officerSignatureUploadId: optionalUploadId,
  borrowerThumbprintManualPlaceholder: z.boolean().optional(),
  guarantorThumbprintManualPlaceholder: z.boolean().optional(),
});

export const businessStepSchema = businessSchema.superRefine((data, ctx) => {
  if (data.typeOfWork === 'Other' && !data.typeOfWorkOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the type of work.',
      path: ['typeOfWorkOther'],
    });
  }
});

export const borrowerRegistrationSchema = personalDetailsBaseSchema
  .merge(addressSchema)
  .merge(businessSchema)
  .merge(guarantorBaseSchema)
  .merge(photoSchema)
  .merge(signatureSchema)
  .superRefine((data, ctx) => {
    refineBorrowerId(ctx, data.idType, data.idNumber, 'idNumber');
    refineBorrowerId(ctx, data.guarantorIdType, data.guarantorIdNumber, 'guarantorIdNumber');
    if (data.typeOfWork === 'Other' && !data.typeOfWorkOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify the type of work.',
        path: ['typeOfWorkOther'],
      });
    }
  })
  .refine((data) => data.guarantorPhone !== data.phone, {
    message: 'Guarantor phone must differ from borrower phone.',
    path: ['guarantorPhone'],
  });

export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type GuarantorInput = z.infer<typeof guarantorSchema>;
export type PhotoInput = z.infer<typeof photoSchema>;
export type BorrowerRegistrationInput = z.infer<typeof borrowerRegistrationSchema>;

export const REGISTRATION_STEP_SCHEMAS = [
  personalDetailsSchema,
  addressSchema,
  businessStepSchema,
  guarantorSchema,
  photoSchema,
  signatureSchema,
] as const;

export const REGISTRATION_STEP_FIELD_NAMES = [
  Object.keys(personalDetailsBaseSchema.shape),
  Object.keys(addressSchema.shape),
  Object.keys(businessSchema.shape),
  Object.keys(guarantorBaseSchema.shape),
  ['photo'],
  [
    'borrowerSignatureUploadId',
    'borrowerThumbprintUploadId',
    'guarantorSignatureUploadId',
    'guarantorThumbprintUploadId',
    'officerSignatureUploadId',
    'borrowerThumbprintManualPlaceholder',
    'guarantorThumbprintManualPlaceholder',
  ],
] as const;
