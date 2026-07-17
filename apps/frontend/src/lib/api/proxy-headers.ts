/** Hop-by-hop and encoding headers that must not be forwarded after body buffering. */
const STRIPPED_RESPONSE_HEADERS = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'upgrade',
] as const;

/**
 * Remove encoding-related headers from an upstream response before returning
 * through the BFF. Node fetch decompresses bodies when read via arrayBuffer(),
 * so forwarding Content-Encoding causes ERR_CONTENT_DECODING_FAILED in browsers.
 */
export function sanitizeProxyResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers(upstreamHeaders);
  for (const name of STRIPPED_RESPONSE_HEADERS) {
    headers.delete(name);
  }
  return headers;
}

/** Prevent upstream compression when the BFF will buffer and re-emit the body. */
export function sanitizeProxyRequestHeaders(incoming: Headers): Headers {
  const headers = new Headers(incoming);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('accept-encoding');
  headers.set('accept-encoding', 'identity');

  const existing = headers.get('x-request-id')?.trim();
  if (!existing || existing.length === 0 || existing.length > 128) {
    headers.set('x-request-id', crypto.randomUUID());
  }

  return headers;
}
