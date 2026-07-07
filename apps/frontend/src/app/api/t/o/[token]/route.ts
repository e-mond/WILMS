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

export async function GET(
  request: Request,
  context: { params: { token: string } },
): Promise<Response> {
  const token = context.params.token.replace(/\.gif$/i, '');
  const upstream = `${resolveApiUpstream()}/tracking/pixel/${token}`;
  const response = await fetch(upstream, { cache: 'no-store' });
  const body = await response.arrayBuffer();

  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  });
}
