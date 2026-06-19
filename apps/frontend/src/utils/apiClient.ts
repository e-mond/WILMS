import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/api';
import { triggerUnauthorizedHandler } from '@/lib/auth/unauthorized-handler';
import { API_ERROR_CODE, ApiError } from '@/types/api';

interface RequestOptions {
  timeoutMs?: number;
}

interface ApiErrorBody {
  message?: string;
  code?: string;
  error?: {
    message?: string;
    code?: string;
  };
}

function unwrapSuccessPayload<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }

  return json as T;
}

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function mapStatusToError(status: number, body: ApiErrorBody | null): ApiError {
  const nested = body?.error;
  const message = nested?.message ?? body?.message ?? 'Request failed';
  const code = nested?.code ?? body?.code;

  if (status === 401 || status === 403) {
    return new ApiError('Your session has expired. Please sign in again.', API_ERROR_CODE.UNAUTHORIZED, status);
  }

  if (status === 404) {
    return new ApiError('The requested resource was not found.', API_ERROR_CODE.NOT_FOUND, status);
  }

  if (status === 409 && (code === API_ERROR_CODE.DUPLICATE_TRANSACTION || body?.code === API_ERROR_CODE.DUPLICATE_TRANSACTION)) {
    return new ApiError(
      'This payment was already recorded for this borrower, date, and amount.',
      API_ERROR_CODE.DUPLICATE_TRANSACTION,
      status,
    );
  }

  if (status === 422) {
    return new ApiError(message, API_ERROR_CODE.VALIDATION, status);
  }

  if (status >= 500) {
    return new ApiError('A server error occurred. Please try again.', API_ERROR_CODE.SERVER, status);
  }

  return new ApiError(message, API_ERROR_CODE.VALIDATION, status);
}

async function parseJsonBody(response: Response): Promise<ApiErrorBody | null> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

async function parseSuccessBody<T>(response: Response): Promise<T> {
  const json = (await response.json()) as unknown;
  return unwrapSuccessPayload<T>(json);
}

async function request<T>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? API_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await parseJsonBody(response);
      throw mapStatusToError(response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return parseSuccessBody<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === API_ERROR_CODE.UNAUTHORIZED && typeof window !== 'undefined') {
        triggerUnauthorizedHandler();
      }

      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', API_ERROR_CODE.TIMEOUT);
    }

    throw new ApiError('Unable to reach the server. Check your connection.', API_ERROR_CODE.NETWORK);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { method: 'GET' }, options);
  },

  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(
      path,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      options,
    );
  },

  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(
      path,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      options,
    );
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { method: 'DELETE' }, options);
  },
};
