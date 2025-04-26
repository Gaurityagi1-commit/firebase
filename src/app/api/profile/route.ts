// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import { verifyAuthAndRole } from '@/lib/authUtils';
import type { UserProfile } from '@/types';

const saltRounds = 10;

// Schema for updating own profile (subset of admin update)
const profileUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  // Allow changing password, require current password for verification? (More secure)
  currentPassword: z.string().optional(), // Required if changing password
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
}).partial().refine(data => {
    // If newPassword is provided, currentPassword must also be provided
    return !(data.newPassword && !data.currentPassword);
}, {
    message: "Current password is required to set a new password.",
    path: ["currentPassword"], // Attach error to currentPassword field
});

// GET /api/profile - Fetch the current logged-in user's profile
export async function GET(request: NextRequest) {
  const authResult = await verifyAuthAndRole(request); // Just check authentication
  if (!authResult.user || authResult.response) {
    return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const userId = authResult.user.userId;

  try {
    const { collections } = await connectToDatabase();
    const userDoc = await collections.users.findOne({ _id: new ObjectId(userId) });

    if (!userDoc) {
      // This shouldn't happen if the token was valid, but good practice
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userProfile } = mapMongoId(userDoc);
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error(`Failed to fetch profile for user ${userId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profile - Update the current logged-in user's profile
export async function PUT(request: NextRequest) {
  const authResult = await verifyAuthAndRole(request); // Check authentication
   if (!authResult.user || authResult.response) {
    return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const userId = authResult.user.userId;

  try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = profileUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid profile data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { currentPassword, newPassword, ...updateData } = parseResult.data;
    let updateQuery: Record<string, any> = { ...updateData };


    if (Object.keys(updateQuery).length === 0 && !newPassword) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

     // --- Password Change Logic ---
     if (newPassword && currentPassword) {
        const userDoc = await collections.users.findOne({ _id: new ObjectId(userId) });
        if (!userDoc) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, userDoc.passwordHash);
        if (!passwordMatch) {
            return NextResponse.json({ message: 'Incorrect current password' }, { status: 403 }); // Forbidden
        }

        // Hash the new password
        updateQuery.passwordHash = await bcrypt.hash(newPassword, saltRounds);
     } else if (newPassword && !currentPassword) {
         // This case should be caught by the refine validation, but double-check
         return NextResponse.json({ message: 'Current password is required to set a new password.' }, { status: 400 });
     }
     // --- End Password Change Logic ---


    // Check for username/email conflicts if they are being changed
    if (updateData.username || updateData.email) {
        const conflictQuery: any = { _id: { $ne: new ObjectId(userId) } }; // Exclude current user
        const orConditions = [];
        if (updateData.username) orConditions.push({ username: updateData.username });
        if (updateData.email) orConditions.push({ email: updateData.email });
        conflictQuery.$or = orConditions;

        const existingUser = await collections.users.findOne(conflictQuery);
         if (existingUser) {
             const message = existingUser.username === updateData.username ? 'Username already taken' : 'Email already registered';
             return NextResponse.json({ message }, { status: 409 }); // Conflict
         }
    }


    const updateResult = await collections.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateQuery },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return NextResponse.json({ message: 'User not found during update' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...updatedProfile } = mapMongoId(updateResult);
    return NextResponse.json(updatedProfile);

  } catch (error: any) {
    console.error(`Failed to update profile for user ${userId}:`, error);
      if (error.code === 11000) { // Handle potential duplicate key errors during update
         const field = Object.keys(error.keyPattern)[0];
         const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
        return NextResponse.json({ message }, { status: 409 });
      }
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
