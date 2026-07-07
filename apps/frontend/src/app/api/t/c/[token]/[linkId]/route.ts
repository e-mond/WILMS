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
  context: { params: { token: string; linkId: string } },
): Promise<Response> {
  const url = new URL(request.url);
  const destination = url.searchParams.get('url') ?? '';
  const upstream = `${resolveApiUpstream()}/tracking/click/${context.params.token}/${context.params.linkId}?url=${encodeURIComponent(destination)}`;
  const response = await fetch(upstream, { redirect: 'manual', cache: 'no-store' });

  const location = response.headers.get('location');
  if (location) {
    return Response.redirect(location, 302);
  }

  return Response.redirect(destination || 'https://wilms.vercel.app', 302);
}
