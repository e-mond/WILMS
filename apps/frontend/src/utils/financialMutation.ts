import { API_ERROR_CODE, ApiError } from '@/types/api';

export type FinancialMutationDomain =
  | 'reconciliation'
  | 'payment'
  | 'disbursement'
  | 'reversal'
  | 'adjustment'
  | 'loan_create'
  | 'generic';

export interface FinancialMutationOptions {
  /** Reuse across retries of the same logical mutation lifecycle. */
  idempotencyKey?: string;
  domain?: FinancialMutationDomain;
  requestId?: string;
  timeoutMs?: number;
}

export interface FinancialMutationHeaders {
  'Idempotency-Key': string;
  'x-request-id'?: string;
  [header: string]: string | undefined;
}

/**
 * Creates or reuses an Idempotency-Key for a financial mutation lifecycle.
 * Callers should keep the returned key when retrying the same user action.
 */
export function createFinancialMutationKey(existing?: string): string {
  if (existing?.trim()) {
    return existing.trim();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildFinancialMutationHeaders(
  options: FinancialMutationOptions = {},
): { key: string; headers: FinancialMutationHeaders } {
  const key = createFinancialMutationKey(options.idempotencyKey);
  const headers: FinancialMutationHeaders = {
    'Idempotency-Key': key,
  };
  if (options.requestId?.trim()) {
    headers['x-request-id'] = options.requestId.trim();
  }
  return { key, headers };
}

export function mapFinancialMutationError(
  error: unknown,
  domain: FinancialMutationDomain = 'generic',
): ApiError {
  if (error instanceof ApiError) {
    if (
      error.code === API_ERROR_CODE.LOAN_NOT_READY_FOR_DISBURSEMENT ||
      (error.status === 422 &&
        /pending disbursement|not ready for disbursement|complete approval/i.test(error.message))
    ) {
      return new ApiError(
        'This loan is not ready for disbursement yet. Complete approval and admin-fee requirements first.',
        API_ERROR_CODE.LOAN_NOT_READY_FOR_DISBURSEMENT,
        422,
      );
    }

    if (
      error.code === API_ERROR_CODE.IDEMPOTENCY_REQUIRED ||
      /Idempotency-Key/i.test(error.message)
    ) {
      if (domain === 'reconciliation') {
        return new ApiError(
          'We could not submit today’s reconciliation. Please try again. If the problem continues, contact your administrator.',
          API_ERROR_CODE.IDEMPOTENCY_REQUIRED,
          error.status ?? 400,
        );
      }
      return new ApiError(
        'We could not complete this financial operation. Please try again. If the problem continues, contact your administrator.',
        API_ERROR_CODE.IDEMPOTENCY_REQUIRED,
        error.status ?? 400,
      );
    }

    if (error.code === API_ERROR_CODE.NETWORK || error.code === API_ERROR_CODE.TIMEOUT) {
      return error;
    }

    // Never surface raw backend VALIDATION: prefixes or HTTP implementation details.
    if (/^VALIDATION:?/i.test(error.message) || /^ApiError\b/i.test(error.message)) {
      return new ApiError(
        domainMessage(domain),
        error.code,
        error.status,
      );
    }

    return error;
  }

  return new ApiError(domainMessage(domain), API_ERROR_CODE.SERVER);
}

function domainMessage(domain: FinancialMutationDomain): string {
  switch (domain) {
    case 'reconciliation':
      return 'We could not submit today’s reconciliation. Please try again. If the problem continues, contact your administrator.';
    case 'disbursement':
      return 'This loan cannot be disbursed yet because it has not completed the approval process.';
    case 'payment':
      return 'We could not record this payment. Please try again.';
    case 'reversal':
      return 'We could not reverse this payment. Please try again.';
    case 'adjustment':
      return 'We could not complete this adjustment. Please try again.';
    case 'loan_create':
      return 'We could not create this loan. Please try again.';
    default:
      return 'We could not complete this financial operation. Please try again.';
  }
}

/**
 * Runs a financial mutation with a stable Idempotency-Key for the call lifecycle.
 * Retries of the same returned `run` reuse the same key when callers keep `key`.
 */
export async function financialMutation<T>(
  execute: (headers: Record<string, string>) => Promise<T>,
  options: FinancialMutationOptions = {},
): Promise<{ result: T; key: string }> {
  const { key, headers } = buildFinancialMutationHeaders(options);
  const requestHeaders: Record<string, string> = {
    'Idempotency-Key': headers['Idempotency-Key'],
  };
  if (headers['x-request-id']) {
    requestHeaders['x-request-id'] = headers['x-request-id'];
  }
  try {
    const result = await execute(requestHeaders);
    return { result, key };
  } catch (error) {
    throw mapFinancialMutationError(error, options.domain ?? 'generic');
  }
}
