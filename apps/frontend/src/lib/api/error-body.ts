export function extractApiErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  if (
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }

  return undefined;
}

export function unwrapApiSuccessData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}
