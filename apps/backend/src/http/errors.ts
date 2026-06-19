export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export const ERROR_CODE = {
  VALIDATION: 'VALIDATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  CONFLICT: 'CONFLICT',
  SERVER: 'SERVER',
} as const;
