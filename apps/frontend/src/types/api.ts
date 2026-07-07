export const API_ERROR_CODE = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION: 'VALIDATION',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  CONFLICT: 'CONFLICT',
  OVERPAYMENT: 'OVERPAYMENT',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  readonly status?: number;

  constructor(message: string, code: ApiErrorCode, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
