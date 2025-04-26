// src/lib/authUtils.ts
import { type NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import type { JwtPayload, User, AuthenticatedUser, RoleCheck } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';

/**
 * Verifies the JWT from the request cookies and checks user role.
 *
 * @param request - The NextRequest object.
 * @param requiredRole - Optional role required for authorization. If undefined, only checks for authentication.
 * @returns An object indicating authentication/authorization status and user details or an error response.
 */
export async function verifyAuthAndRole(request: NextRequest, requiredRole?: User['role']): Promise<{
  user: AuthenticatedUser | null;
  response?: NextResponse; // Return a response directly if authentication/authorization fails
}> {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    console.log('Auth check failed: No token found');
    return { user: null, response: NextResponse.json({ message: 'Authentication required' }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Basic check if decoded object has expected properties
    if (!decoded || typeof decoded !== 'object' || !decoded.userId || !decoded.username || !decoded.role) {
        console.error('Auth check failed: Invalid token payload structure', decoded);
        return { user: null, response: NextResponse.json({ message: 'Invalid token payload' }, { status: 401 }) };
    }

    const currentUser: AuthenticatedUser = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    // Check role if required
    if (requiredRole && currentUser.role !== requiredRole) {
      console.log(`Auth check failed: User ${currentUser.username} role (${currentUser.role}) does not match required role (${requiredRole})`);
      return { user: currentUser, response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
    }

    // Authentication and authorization (if required) successful
    // console.log(`Auth check success: User ${currentUser.username}, Role: ${currentUser.role}`);
    return { user: currentUser };

  } catch (error: any) {
    console.error('Auth check failed: JWT verification error:', error.message);
     let message = 'Invalid or expired token';
     if (error.name === 'TokenExpiredError') {
         message = 'Token expired';
     } else if (error.name === 'JsonWebTokenError') {
         message = 'Invalid token';
     }
     // Clear the invalid cookie before sending the response
     const response = NextResponse.json({ message: message }, { status: 401 });
     response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
     return { user: null, response };
  }
}
