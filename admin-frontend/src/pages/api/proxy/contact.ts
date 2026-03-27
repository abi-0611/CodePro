import type { APIRoute } from 'astro';
import { getTokenFromCookies } from '../../../lib/auth';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export const GET: APIRoute = async () => {
  const res = await fetch(`${API_BASE}/api/contact/`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  // Return 200 even if backend returns 404 (no contact yet) — Astro treats 404 as page-not-found
  const status = res.status === 404 ? 200 : res.status;
  return new Response(JSON.stringify(res.status === 404 ? {} : data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ cookies, request }) => {
  const token = getTokenFromCookies(cookies);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const res = await fetch(`${API_BASE}/api/contact/`, {
    method: 'PUT',
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
