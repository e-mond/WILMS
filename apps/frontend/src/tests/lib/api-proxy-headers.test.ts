import { describe, expect, it } from 'vitest';
import {
  sanitizeProxyRequestHeaders,
  sanitizeProxyResponseHeaders,
} from '@/lib/api/proxy-headers';

describe('sanitizeProxyResponseHeaders', () => {
  it('strips content-encoding and content-length after buffered proxy read', () => {
    const upstream = new Headers({
      'content-type': 'application/json',
      'content-encoding': 'gzip',
      'content-length': '1234',
      'transfer-encoding': 'chunked',
      'x-custom': 'keep-me',
    });

    const sanitized = sanitizeProxyResponseHeaders(upstream);

    expect(sanitized.get('content-encoding')).toBeNull();
    expect(sanitized.get('content-length')).toBeNull();
    expect(sanitized.get('transfer-encoding')).toBeNull();
    expect(sanitized.get('content-type')).toBe('application/json');
    expect(sanitized.get('x-custom')).toBe('keep-me');
  });
});

describe('sanitizeProxyRequestHeaders', () => {
  it('forces identity encoding and removes hop-by-hop headers', () => {
    const incoming = new Headers({
      host: 'wilms.vercel.app',
      connection: 'keep-alive',
      'accept-encoding': 'gzip, deflate, br',
      accept: 'application/json',
    });

    const sanitized = sanitizeProxyRequestHeaders(incoming);

    expect(sanitized.get('host')).toBeNull();
    expect(sanitized.get('connection')).toBeNull();
    expect(sanitized.get('accept-encoding')).toBe('identity');
    expect(sanitized.get('accept')).toBe('application/json');
    expect(sanitized.get('x-request-id')).toBeTruthy();
  });

  it('preserves a valid incoming x-request-id', () => {
    const incoming = new Headers({
      'x-request-id': 'bff-correlation-abc',
      accept: 'application/json',
    });

    const sanitized = sanitizeProxyRequestHeaders(incoming);
    expect(sanitized.get('x-request-id')).toBe('bff-correlation-abc');
  });
});
