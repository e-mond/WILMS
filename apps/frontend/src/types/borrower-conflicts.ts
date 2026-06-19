import type { BorrowerIdType } from '@/constants/borrower-registration';
import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';

export const CONFLICT_SEVERITY = {
  BLOCK: 'BLOCK',
  WARN: 'WARN',
} as const;

export type ConflictSeverity = (typeof CONFLICT_SEVERITY)[keyof typeof CONFLICT_SEVERITY];

export const REGISTRATION_CONFLICT_CODE = {
  DUPLICATE_PHONE: 'DUPLICATE_PHONE',
  DUPLICATE_ID: 'DUPLICATE_ID',
  SIMILAR_NAME: 'SIMILAR_NAME',
  ACTIVE_LOAN: 'ACTIVE_LOAN',
  BLACKLISTED: 'BLACKLISTED',
} as const;

export type RegistrationConflictCode =
  (typeof REGISTRATION_CONFLICT_CODE)[keyof typeof REGISTRATION_CONFLICT_CODE];

export interface RegistrationConflict {
  code: RegistrationConflictCode;
  severity: ConflictSeverity;
  message: string;
  field?: keyof BorrowerRegistrationFormValues;
  relatedBorrowerId?: string;
  relatedBorrowerName?: string;
}

export interface RegistrationConflictReport {
  blocking: RegistrationConflict[];
  warnings: RegistrationConflict[];
}

export interface PhoneCheckResult {
  isDuplicate: boolean;
  existingBorrowerId?: string;
  existingBorrowerName?: string;
}

export interface IdCheckResult {
  isDuplicate: boolean;
  existingBorrowerId?: string;
  existingBorrowerName?: string;
}

export interface SimilarNameMatch {
  borrowerId: string;
  fullName: string;
  distance: number;
}

export interface SimilarNameCheckResult {
  matches: SimilarNameMatch[];
}

export interface ActiveLoanCheckResult {
  hasActiveLoan: boolean;
  existingBorrowerId?: string;
  existingBorrowerName?: string;
}

export interface BlacklistCheckResult {
  isBlacklisted: boolean;
  existingBorrowerId?: string;
  existingBorrowerName?: string;
}

export interface RegistrationConflictInput {
  fullName: string;
  phone: string;
  idType?: BorrowerIdType;
  idNumber?: string;
}
