import { API_ERROR_CODE, ApiError } from '@/types/api';

export type QueryErrorVariant =
  | 'error'
  | 'forbidden'
  | 'not-found'
  | 'timeout'
  | 'offline'
  | 'unauthorized';

export interface QueryErrorPresentation {
  title: string;
  description: string;
  canRetry: boolean;
  variant: QueryErrorVariant;
}

export function resolveQueryErrorPresentation(error: unknown): QueryErrorPresentation {
  if (error instanceof ApiError) {
    switch (error.code) {
      case API_ERROR_CODE.NETWORK:
        return {
          title: 'Unable to reach the server',
          description: 'Check your internet connection and try again.',
          canRetry: true,
          variant: 'offline',
        };
      case API_ERROR_CODE.TIMEOUT:
        return {
          title: 'Request timed out',
          description: 'The server is taking too long to respond. Please try again.',
          canRetry: true,
          variant: 'timeout',
        };
      case API_ERROR_CODE.UNAUTHORIZED:
        return {
          title: 'Session expired',
          description: 'Please sign in again to continue.',
          canRetry: false,
          variant: 'unauthorized',
        };
      case API_ERROR_CODE.FORBIDDEN:
        return {
          title: 'Access denied',
          description:
            error.message === 'Request failed'
              ? 'You do not have permission to view this data.'
              : error.message,
          canRetry: false,
          variant: 'forbidden',
        };
      case API_ERROR_CODE.NOT_FOUND:
        return {
          title: 'Not found',
          description: error.message,
          canRetry: false,
          variant: 'not-found',
        };
      case API_ERROR_CODE.SERVER:
        return {
          title: 'Server error',
          description: 'Something went wrong on our side. Please try again shortly.',
          canRetry: true,
          variant: 'error',
        };
      case API_ERROR_CODE.VALIDATION:
        return {
          title: 'Unable to load this data',
          description: error.message,
          canRetry: true,
          variant: 'error',
        };
      default:
        return {
          title: 'Unable to load this data',
          description: error.message,
          canRetry: true,
          variant: 'error',
        };
    }
  }

  return {
    title: 'Unable to load this data',
    description: 'Please try again.',
    canRetry: true,
    variant: 'error',
  };
}

export function resolveQueryErrorMessage(error: unknown): string {
  const presentation = resolveQueryErrorPresentation(error);
  return `${presentation.title}. ${presentation.description}`;
}
