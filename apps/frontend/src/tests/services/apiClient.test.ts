import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import { apiClient } from '@/utils/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses successful JSON responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'payment-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiClient.get<{ id: string }>('/payments/payment-1')).resolves.toEqual({
      id: 'payment-1',
    });
  });

  it('maps 401 responses to session expired ApiError', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiClient.get('/borrowers')).rejects.toMatchObject({
      code: API_ERROR_CODE.UNAUTHORIZED,
      status: 401,
      message: 'Your session has expired. Please sign in again.',
    } satisfies Partial<ApiError>);
  });

  it('maps 403 responses to forbidden ApiError', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: 'You do not have permission to perform this action.',
            code: 'UNAUTHORIZED',
          },
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(apiClient.get('/reconciliations')).rejects.toMatchObject({
      code: API_ERROR_CODE.FORBIDDEN,
      status: 403,
      message: 'You do not have permission to perform this action.',
    } satisfies Partial<ApiError>);
  });

  it('maps duplicate transaction responses to ApiError', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: 'Duplicate',
          code: API_ERROR_CODE.DUPLICATE_TRANSACTION,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(
      apiClient.post('/payments', {
        borrowerId: 'b-1',
        amountPesewas: 5000,
        paymentDate: '2026-06-06',
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.DUPLICATE_TRANSACTION,
      status: 409,
    } satisfies Partial<ApiError>);
  });

  it('sends credentials with every request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiClient.get('/health');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
