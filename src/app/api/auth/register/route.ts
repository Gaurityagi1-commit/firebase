import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import bcrypt from 'bcrypt';
import type { User } from '@/types';
import { z } from 'zod';

const USERS_KEY = 'users'; // Key for storing users in KV
const saltRounds = 10; // Cost factor for hashing

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid registration data', errors: parseResult.error.errors }, { status: 400 });
    }

    const { username, email, password } = parseResult.data;

    // Fetch existing users
    const existingUsers: User[] = (await kv.get(USERS_KEY)) || [];

    // Check if username or email already exists
    const usernameExists = existingUsers.some(user => user.username === username);
    if (usernameExists) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 }); // 409 Conflict
    }
    const emailExists = existingUsers.some(user => user.email === email);
    if (emailExists) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username,
      email,
      passwordHash,
      role: 'user', // Default role is 'user'
      createdAt: new Date(),
    };

    // Add the new user and save back
    const updatedUsers = [...existingUsers, newUser];
    await kv.set(USERS_KEY, updatedUsers);

     // Don't return the password hash
    const { passwordHash: _, ...userResponse } = newUser;

    return NextResponse.json({ message: 'User registered successfully', user: userResponse }, { status: 201 });

  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ message: 'Failed to register user' }, { status: 500 });
  }
}
