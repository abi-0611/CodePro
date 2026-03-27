import type { APIRoute } from 'astro';
import { getTokenFromCookies } from '../../../../../lib/auth';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export const POST: APIRoute = async ({ params, cookies }) => {
  const token = getTokenFromCookies(cookies);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(`${API_BASE}/api/courses/${params.slug}/toggle-publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
