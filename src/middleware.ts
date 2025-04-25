import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';
const LOGIN_URL = '/login';

// Define public paths that don't require authentication
const publicPaths = [LOGIN_URL, '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests to public paths and API auth routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Assume paths with extensions are files
  ) {
    return NextResponse.next();
  }


  // Get the token from the cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login if no token found
    return NextResponse.redirect(new URL(LOGIN_URL, request.url));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Add user info to the request headers for access in Server Components/API Routes (optional)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Id', decoded.userId);
    requestHeaders.set('X-User-Username', decoded.username);
    requestHeaders.set('X-User-Role', decoded.role);

    // Allow the request to proceed
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    // Handle invalid or expired token
    console.error('JWT verification failed:', error);

    // Clear the invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL(LOGIN_URL, request.url));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' }); // Clear cookie
    return response;
  }
}

// Define the paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api routes that are *not* auth related (allow auth api routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (already implicitly handled by the check above)
     */
    // '/((?!api/auth|_next/static|_next/image|favicon.ico).*)', // Initial complex matcher
    // Simplified matcher - apply to all paths, then filter inside the middleware
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
