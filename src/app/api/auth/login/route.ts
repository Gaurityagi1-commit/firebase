export const runtime = 'nodejs'; // ✅ Use Node.js runtime instead of Edge

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import type { User, JwtPayload, MongoDoc } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';
const JWT_EXPIRES_IN = '1h';

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

    const userDoc = await collections.users.findOne({ username });

    if (!userDoc) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    const user = mapMongoId(userDoc);

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // ✅ Await cookies() before setting
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    const { passwordHash: _, ...userResponse } = user;

    return NextResponse.json({ message: 'Login successful', user: userResponse });

  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Internal server error during login' }, { status: 500 });
  }
}
