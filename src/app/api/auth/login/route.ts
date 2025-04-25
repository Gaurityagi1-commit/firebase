import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import type { User, JwtPayload, MongoDoc } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret'; // Use environment variable
const JWT_EXPIRES_IN = '1h'; // Token expiration time

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { db, collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid login data' }, { status: 400 });
    }

    const { username, password } = parseResult.data;

    // Find user by username
    const userDoc = await collections.users.findOne({ username });

    if (!userDoc) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 }); // Unauthorized
    }

    // Compare provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    // Map MongoDB document to User type for JWT payload
    const user = mapMongoId(userDoc);

    // Generate JWT
    const payload: JwtPayload = {
      userId: user.id, // Use the string ID from mapped user
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

    // Don't return the password hash in the response body
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userResponse } = user;

    // Return success message and user info (optional)
    return NextResponse.json({ message: 'Login successful', user: userResponse });

  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Internal server error during login' }, { status: 500 });
  }
}
