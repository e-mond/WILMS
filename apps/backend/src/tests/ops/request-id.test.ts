import { describe, expect, it } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { REQUEST_ID_HEADER, getRequestId, requestIdMiddleware } from '../../middleware/request-id.js';

describe('requestIdMiddleware', () => {
  it('assigns a request id when none is provided', () => {
    const req = { header: () => undefined } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
    } as unknown as Response;

    let seen: string | undefined;
    const next: NextFunction = () => {
      seen = getRequestId();
    };

    requestIdMiddleware(req, res, next);
    expect(seen).toBeTruthy();
    expect(headers[REQUEST_ID_HEADER]).toBe(seen);
  });

  it('propagates an incoming x-request-id', () => {
    const incoming = 'client-correlation-id-001';
    const req = {
      header: (name: string) => (name === REQUEST_ID_HEADER ? incoming : undefined),
    } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
    } as unknown as Response;

    let seen: string | undefined;
    requestIdMiddleware(req, res, () => {
      seen = getRequestId();
    });

    expect(seen).toBe(incoming);
    expect(headers[REQUEST_ID_HEADER]).toBe(incoming);
  });
});
