import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  sanitizeProxyRequestHeaders,
  sanitizeProxyResponseHeaders,
} from '@/lib/api/proxy-headers';
import { rejectInvalidCsrf } from '@/lib/auth/csrf-server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

function resolveApiUpstream(): string {
  const upstream = process.env.WILMS_API_UPSTREAM?.trim();
  if (upstream) {
    return upstream.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('WILMS_API_UPSTREAM is required in production');
  }
  return 'http://127.0.0.1:4000';
}

async function proxyRequest(request: Request, pathSegments: string[]): Promise<Response> {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfFailure = rejectInvalidCsrf(request);
    if (csrfFailure) {
      return csrfFailure;
    }
  }

  const apiUpstream = resolveApiUpstream();
  const upstreamPath = `/api/v1/${pathSegments.join('/')}${new URL(request.url).search}`;
  const upstreamUrl = `${apiUpstream}${upstreamPath}`;
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

  const upstreamResponse = await fetch(upstreamUrl, init);
  const body = await upstreamResponse.arrayBuffer();

  return new NextResponse(body, {
    status: upstreamResponse.status,
    headers: sanitizeProxyResponseHeaders(upstreamResponse.headers),
  });
}

export async function GET(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return proxyRequest(request, context.params.path);
}

export async function POST(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return proxyRequest(request, context.params.path);
}

export async function PATCH(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return proxyRequest(request, context.params.path);
}

export async function DELETE(
  request: Request,
  context: { params: { path: string[] } },
): Promise<Response> {
  return proxyRequest(request, context.params.path);
}
