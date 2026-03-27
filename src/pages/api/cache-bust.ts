import type { APIRoute } from 'astro';
import { clearApiCache } from '../../lib/api';

export const POST: APIRoute = async ({ url }) => {
  const secret = url.searchParams.get('secret');
  if (secret !== import.meta.env.CACHE_BUST_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  clearApiCache();
  return new Response(JSON.stringify({ cleared: true, timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
