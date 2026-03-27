import type { APIRoute } from 'astro';
import { setAuthCookies } from '../../../lib/auth';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Forward to FastAPI as form data (OAuth2 compat)
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ success: false, error: err.detail || 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = await res.json();
    setAuthCookies(cookies, data.access_token, data.refresh_token);

    // Fetch user info
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = meRes.ok ? await meRes.json() : null;

    return new Response(
      JSON.stringify({ success: true, user }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
