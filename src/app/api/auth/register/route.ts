import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import type { User, MongoDoc } from '@/types';

const saltRounds = 10; // Cost factor for hashing

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const { db, collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid registration data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { username, email, password } = parseResult.data;

    // Check if username or email already exists
    const existingUser = await collections.users.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      const message = existingUser.username === username ? 'Username already taken' : 'Email already registered';
      return NextResponse.json({ message }, { status: 409 }); // 409 Conflict
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUserDocument: Omit<User, 'id'> = {
      username,
      email,
      passwordHash,
      role: 'user', // Default role is 'user'
      createdAt: new Date(),
    };

    // Insert the new user
    const insertResult = await collections.users.insertOne(newUserDocument);

    if (!insertResult.insertedId) {
      throw new Error('Failed to insert user into database.');
    }

    // Fetch the newly created user to return it (without the hash)
    const createdUserDoc = await collections.users.findOne({ _id: insertResult.insertedId });

    if (!createdUserDoc) {
        // Should not happen if insert succeeded, but good practice to check
        throw new Error('Failed to retrieve created user.');
    }

    const userResponse = mapMongoId(createdUserDoc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUserResponse } = userResponse;


    return NextResponse.json({ message: 'User registered successfully', user: safeUserResponse }, { status: 201 });

  } catch (error: any) {
    console.error('Registration failed:', error);
    // Handle potential duplicate key errors from MongoDB index more gracefully
    if (error.code === 11000) { // MongoDB duplicate key error code
         const field = Object.keys(error.keyPattern)[0]; // e.g., 'username' or 'email'
         const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
        return NextResponse.json({ message }, { status: 409 });
    }
    return NextResponse.json({ message: 'An internal error occurred during registration.' }, { status: 500 });
  }
}
