import type { AstroCookies } from 'astro';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_COOKIE = 'codepro_admin_token';
const REFRESH_COOKIE = 'codepro_admin_refresh';

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface LoginResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

// --- Server-side (Astro frontmatter) ---

export function getTokenFromCookies(cookies: AstroCookies): string | null {
  return cookies.get(TOKEN_COOKIE)?.value ?? null;
}

export function setAuthCookies(
  cookies: AstroCookies,
  accessToken: string,
  refreshToken: string,
): void {
  cookies.set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/admin',
    maxAge: 3600,
  });
  cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/admin',
    maxAge: 604800,
  });
}

export function clearAuthCookies(cookies: AstroCookies): void {
  cookies.delete(TOKEN_COOKIE, { path: '/admin' });
  cookies.delete(REFRESH_COOKIE, { path: '/admin' });
}

export function isAuthenticated(cookies: AstroCookies): boolean {
  return !!cookies.get(TOKEN_COOKIE)?.value;
}

export async function verifyTokenWithAPI(
  token: string,
): Promise<{ valid: boolean; user?: AdminUser }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { valid: false };
    const user = await res.json();
    return { valid: true, user };
  } catch {
    return { valid: false };
  }
}

export async function tryRefreshToken(
  cookies: AstroCookies,
): Promise<boolean> {
  const refreshToken = cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    cookies.set(TOKEN_COOKIE, data.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/admin',
      maxAge: 3600,
    });
    return true;
  } catch {
    return false;
  }
}

// --- Client-side helpers ---

export function getApiBase(): string {
  return API_BASE;
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch('/admin/api/admin-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || 'Invalid credentials' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function logoutRequest(): Promise<void> {
  await fetch('/admin/api/admin-auth/logout', { method: 'POST' });
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = path.startsWith('http') ? path : `/admin/api/proxy${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
