// middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// ✅ Force Node.js runtime so we can use jsonwebtoken
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';
const LOGIN_URL = '/login';

// Define public paths that don't require authentication
const publicPaths = [LOGIN_URL, '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests to public paths and API auth routes
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // files like .js, .css, etc.
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_URL, request.url));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Id', decoded.userId);
    requestHeaders.set('X-User-Username', decoded.username);
    requestHeaders.set('X-User-Role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('JWT verification failed:', error);

    const response = NextResponse.redirect(new URL(LOGIN_URL, request.url));
    response.cookies.set('auth_token', '', {
      maxAge: 0,
      path: '/',
    });
    return response;
  }
}

// Apply this middleware to all paths except some static ones
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
