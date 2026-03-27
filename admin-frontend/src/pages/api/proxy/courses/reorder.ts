import type { APIRoute } from 'astro';
import { getTokenFromCookies } from '../../../../lib/auth';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export const POST: APIRoute = async ({ cookies, request }) => {
  const token = getTokenFromCookies(cookies);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const res = await fetch(`${API_BASE}/api/courses/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
