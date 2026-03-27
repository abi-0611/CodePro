import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const API_BASE = import.meta.env.API_URL || 'http://localhost:8000';
  let apiReachable = false;

  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    apiReachable = res.ok;
  } catch {
    apiReachable = false;
  }

  return new Response(
    JSON.stringify({
      status: apiReachable ? 'healthy' : 'degraded',
      api: apiReachable ? 'connected' : 'unreachable',
      timestamp: new Date().toISOString(),
    }),
    {
      status: apiReachable ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
