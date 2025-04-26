// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt'; // For potential password updates
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import { verifyAuthAndRole } from '@/lib/authUtils';
import type { UserProfile } from '@/types';

const saltRounds = 10; // Cost factor for hashing (if password is updated)

// Schema for updating user details (Admin)
const userUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'user']).optional(),
  // Add password update if needed, requires careful handling (e.g., separate endpoint or specific checks)
  // password: z.string().min(6, 'Password must be at least 6 characters').optional(),
}).partial(); // Makes all fields optional


function isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id);
}

// GET /api/users/[id] - Fetch a single user by ID (Admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await verifyAuthAndRole(request, 'admin');
  if (authResult.response) {
    return authResult.response;
  }

  const userId = params.id;
  if (!isValidObjectId(userId)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    const { collections } = await connectToDatabase();
    const userDoc = await collections.users.findOne({ _id: new ObjectId(userId) });

    if (!userDoc) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userResponse } = mapMongoId(userDoc);
    return NextResponse.json(userResponse);
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a user by ID (Admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await verifyAuthAndRole(request, 'admin');
  if (authResult.response) {
    return authResult.response;
  }

  const userIdToUpdate = params.id;
  if (!isValidObjectId(userIdToUpdate)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = userUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid user data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    let updateData = parseResult.data;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    // If password needs updating, hash it here (Add password to schema if implementing)
    // if (updateData.password) {
    //   updateData.passwordHash = await bcrypt.hash(updateData.password, saltRounds);
    //   delete updateData.password; // Don't store plain password
    // }


    // Prevent admin from demoting the last admin or deleting their own admin role? (Add logic if needed)

    // Check for username/email conflicts if they are being changed
    if (updateData.username || updateData.email) {
        const conflictQuery: any = { _id: { $ne: new ObjectId(userIdToUpdate) } }; // Exclude current user
        const orConditions = [];
        if (updateData.username) orConditions.push({ username: updateData.username });
        if (updateData.email) orConditions.push({ email: updateData.email });
        conflictQuery.$or = orConditions;

        const existingUser = await collections.users.findOne(conflictQuery);
         if (existingUser) {
             const message = existingUser.username === updateData.username ? 'Username already taken' : 'Email already registered';
             return NextResponse.json({ message }, { status: 409 }); // 409 Conflict
         }
    }


    const updateResult = await collections.users.findOneAndUpdate(
      { _id: new ObjectId(userIdToUpdate) },
      { $set: updateData },
      { returnDocument: 'after' } // Return the updated document
    );

    if (!updateResult) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...updatedUser } = mapMongoId(updateResult);
    return NextResponse.json(updatedUser);

  } catch (error: any) {
    console.error(`Failed to update user ${userIdToUpdate}:`, error);
     if (error.code === 11000) { // Handle potential duplicate key errors during update
         const field = Object.keys(error.keyPattern)[0];
         const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
        return NextResponse.json({ message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a user by ID (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifyAuthAndRole(request, 'admin');
    if (!authResult.user || authResult.response) {
        return authResult.response ?? NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const adminUserId = authResult.user.userId;


  const userIdToDelete = params.id;

   if (!isValidObjectId(userIdToDelete)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
   }

    // Prevent admin from deleting themselves
    if (adminUserId === userIdToDelete) {
        return NextResponse.json({ message: 'Admin cannot delete their own account' }, { status: 403 });
    }


  try {
    const { collections } = await connectToDatabase();

    // Optional: Check if the user being deleted is the *last* admin
    // const userToDeleteDoc = await collections.users.findOne({ _id: new ObjectId(userIdToDelete) });
    // if (userToDeleteDoc?.role === 'admin') {
    //     const adminCount = await collections.users.countDocuments({ role: 'admin' });
    //     if (adminCount <= 1) {
    //         return NextResponse.json({ message: 'Cannot delete the last admin account' }, { status: 403 });
    //     }
    // }

    const deleteResult = await collections.users.deleteOne({ _id: new ObjectId(userIdToDelete) });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // IMPORTANT: Also delete associated data for the user (clients, quotations, reminders)
    // This prevents orphaned data. Run these in parallel for efficiency.
    await Promise.all([
        collections.clients.deleteMany({ userId: userIdToDelete }),
        collections.quotations.deleteMany({ userId: userIdToDelete }),
        collections.reminders.deleteMany({ userId: userIdToDelete })
    ]);
    console.log(`Deleted user ${userIdToDelete} and their associated data.`);


    return NextResponse.json({ message: 'User and associated data deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete user ${userIdToDelete}:`, error);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}
