import { defineMiddleware } from 'astro:middleware';
import { getTokenFromCookies, tryRefreshToken, clearAuthCookies } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Public routes — allow through
  const publicRoutes = ['/admin/login', '/admin/api/'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return next();
  }

  // Protected routes — check token
  if (pathname.startsWith('/admin/dashboard') || pathname === '/admin' || pathname === '/admin/') {
    const token = getTokenFromCookies(context.cookies);
    if (!token) {
      // Try refresh
      const refreshed = await tryRefreshToken(context.cookies);
      if (!refreshed) {
        clearAuthCookies(context.cookies);
        return context.redirect('/admin/login');
      }
    }
  }

  return next();
});
