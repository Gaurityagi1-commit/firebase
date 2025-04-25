import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { User, JwtPayload } from '@/types';
import { z } from 'zod';
import { cookies } from 'next/headers'; // Import cookies

const USERS_KEY = 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret'; // Use environment variable
const JWT_EXPIRES_IN = '1h'; // Token expiration time

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid login data' }, { status: 400 });
    }

    const { username, password } = parseResult.data;

    // Fetch existing users
    const existingUsers: User[] | null = await kv.get(USERS_KEY);

    if (!existingUsers) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 }); // Unauthorized
    }

    // Find user by username
    const user = existingUsers.find(u => u.username === username);
    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    // Compare provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    // Generate JWT
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Set the token in an HTTP-only cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'strict', // Strict SameSite policy
      path: '/', // Cookie available on all paths
      maxAge: 60 * 60, // 1 hour in seconds (matches JWT expiry)
    });

    // Don't return the password hash
    const { passwordHash: _, ...userResponse } = user;

    // Return success message and user info (optional)
    return NextResponse.json({ message: 'Login successful', user: userResponse });

  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Internal server error during login' }, { status: 500 });
  }
}
