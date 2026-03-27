import type { APIRoute } from 'astro';
import { getTokenFromCookies } from '../../../lib/auth';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export const GET: APIRoute = async ({ cookies }) => {
  const token = getTokenFromCookies(cookies);
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'API unavailable' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
