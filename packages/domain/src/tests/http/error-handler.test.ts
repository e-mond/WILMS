import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { errorHandler } from '../../http/error-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('errorHandler', () => {
  it('returns AppError messages unchanged', () => {
    const res = mockRes();
    errorHandler(
      new AppError('Borrower not found.', ERROR_CODE.NOT_FOUND, 404),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      error: { message: 'Borrower not found.', code: 'NOT_FOUND' },
    });
  });

  it('does not leak raw Error.message on unexpected failures', () => {
    const res = mockRes();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    errorHandler(
      new Error('relation "secret_table" does not exist'),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret_table');
    expect(res.body).toMatchObject({
      error: { message: 'An unexpected error occurred. Please try again.', code: 'SERVER' },
    });
    spy.mockRestore();
  });
});
