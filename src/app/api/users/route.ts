// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import { verifyAuthAndRole } from '@/lib/authUtils';
import type { UserProfile } from '@/types';

// GET /api/users - Fetch all users (Admin only)
export async function GET(request: NextRequest) {
  const authResult = await verifyAuthAndRole(request, 'admin');
  if (authResult.response) {
    return authResult.response; // Access denied or authentication required
  }
  // If we reach here, user is authenticated and is an admin

  try {
    const { collections } = await connectToDatabase();
    const userDocs = await collections.users.find({}).sort({ createdAt: -1 }).toArray();

    // Map _id to id and remove passwordHash for the response
    const users: UserProfile[] = userDocs.map(mapMongoId).map(({ passwordHash, ...rest }) => rest);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users (admin):', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}
