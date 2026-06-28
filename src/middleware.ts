import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define paths that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/favicon.ico'
  ) {
    // If user is already logged in and attempts to access /login, redirect to their home dashboard
    if (pathname === '/login') {
      const token = request.cookies.get('token')?.value;
      if (token) {
        const payload = await verifyJWT(token);
        if (payload) {
          return NextResponse.redirect(new URL(getHomeRoute(payload.role), request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Check auth token
  const token = request.cookies.get('token')?.value;
  if (!token) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    // Invalid token, clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Role-based access control (RBAC)
  // Let's support a mock role override for testing & showcase
  const mockRole = request.cookies.get('mock_role')?.value;
  const activeRole = (payload.role === 'SUPER_ADMIN' && mockRole) ? mockRole : payload.role;

  if (pathname.startsWith('/admin') && activeRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL(getHomeRoute(activeRole), request.url));
  }

  if (pathname.startsWith('/doctor') && activeRole !== 'DOCTOR') {
    // Allow SUPER_ADMIN to bypass
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL(getHomeRoute(activeRole), request.url));
    }
  }

  if (pathname.startsWith('/receptionist') && activeRole !== 'RECEPTIONIST') {
    // Allow SUPER_ADMIN or DOCTOR to bypass
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'DOCTOR') {
      return NextResponse.redirect(new URL(getHomeRoute(activeRole), request.url));
    }
  }

  // Inject user info headers for API or SSR pages
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-email', payload.email);
  response.headers.set('x-user-role', payload.role);
  return response;
}

function getHomeRoute(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'DOCTOR':
      return '/doctor';
    case 'RECEPTIONIST':
      return '/receptionist';
    default:
      return '/login';
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/receptionist/:path*',
    '/login',
  ],
};
