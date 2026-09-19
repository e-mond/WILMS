export { loginApiSchema, ghanaPhoneSchema, type LoginApiInput } from './login-api.schema';
export {
  BORROWER_ID_ERROR_MESSAGES,
  BORROWER_ID_HELPER_TEXTS,
  BORROWER_ID_NUMBER_LABELS,
  BORROWER_ID_PLACEHOLDERS,
  formatGhanaCardInput,
  formatVoterIdInput,
  normalizeBorrowerId,
  normalizeVoterId,
  validateBorrowerId,
  type BorrowerIdType,
  type BorrowerIdValidationResult,
} from './borrower-id.schema';
