import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { resolveWilmsProxyUpstreamPath } from '@/lib/api/upstream-path';
import { rejectInvalidCsrf } from '@/lib/auth/csrf-server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Token-gated mobile capture routes; CSRF is not applicable without a browser session. */
function isPhotoCapturePublicPath(path: string): boolean {
  return path.startsWith('photo-capture/sessions/');
}

function hasUsableUpstream(): boolean {
  const raw = process.env.WILMS_API_UPSTREAM?.trim();
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function resolveApiMode(): 'proxy' | 'inprocess' {
  const mode = process.env.WILMS_API_MODE?.trim().toLowerCase();
  if (mode === 'proxy') return 'proxy';
  if (mode === 'inprocess' || mode === 'in-process') return 'inprocess';
  // Migration safety: valid Railway-style upstream still set → prefer proxy
  // until operators explicitly set WILMS_API_MODE=inprocess.
  if (hasUsableUpstream()) return 'proxy';
  return 'inprocess';
}

/**
 * Same-origin Route Handler: runs @wilms/domain in-process, or proxies upstream when configured.
 */
async function handleRequest(request: Request, pathSegments: string[]): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = pathSegments.join('/');

  if (
    method !== 'GET' &&
    method !== 'HEAD' &&
    method !== 'OPTIONS' &&
    !isPhotoCapturePublicPath(path)
  ) {
    const csrfFailure = rejectInvalidCsrf(request);
    if (csrfFailure) {
      return csrfFailure;
    }
  }

  const search = new URL(request.url).search;
  const expressPathWithSearch = resolveWilmsProxyUpstreamPath(path, search);
  const expressPath = expressPathWithSearch.split('?')[0] ?? expressPathWithSearch;

  if (resolveApiMode() === 'proxy') {
    return proxyToUpstream(request, expressPathWithSearch);
  }

  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  const headers = new Headers(request.headers);
  if (sessionCookie && !headers.get('authorization')) {
    headers.set('authorization', `Bearer ${sessionCookie}`);
  }

  const forwarded = new Request(request.url, {
    method: request.method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
  });

  try {
    const { handleWilmsFetchRequest } = await import('@wilms/domain');
    return await handleWilmsFetchRequest(forwarded, { expressPath });
  } catch (error) {
    console.error('[wilms-api] in-process handler failed', error);
    return NextResponse.json(
      {
        error: {
          message: 'API temporarily unavailable.',
          code: 'API_UNAVAILABLE',
          detail:
            error instanceof Error ? error.message : 'Unknown in-process API failure',
        },
      },
      { status: 503 },
    );
  }
}

async function proxyToUpstream(request: Request, upstreamPath: string): Promise<Response> {
  const { sanitizeProxyRequestHeaders, sanitizeProxyResponseHeaders } = await import(
    '@/lib/api/proxy-headers'
  );

  const upstream =
    process.env.WILMS_API_UPSTREAM?.trim()?.replace(/\/$/, '') || 'http://127.0.0.1:4000';
  const upstreamUrl = `${upstream}${upstreamPath}`;
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  const headers = sanitizeProxyRequestHeaders(request.headers);
  if (sessionCookie) {
    headers.set('authorization', `Bearer ${sessionCookie}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, init);
    const body = await upstreamResponse.arrayBuffer();
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: sanitizeProxyResponseHeaders(upstreamResponse.headers),
    });
  } catch (error) {
    console.error('[wilms-bff] upstream unavailable', error);
    return NextResponse.json(
      { error: { message: 'Upstream API unavailable.', code: 'UPSTREAM_UNAVAILABLE' } },
      { status: 503 },
    );
  }
}

export async function GET(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return handleRequest(request, context.params.path);
}

export async function POST(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return handleRequest(request, context.params.path);
}

export async function PATCH(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return handleRequest(request, context.params.path);
}

export async function PUT(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return handleRequest(request, context.params.path);
}

export async function DELETE(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return handleRequest(request, context.params.path);
}
