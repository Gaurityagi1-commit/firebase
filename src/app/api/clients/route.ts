import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import { verifyAuthAndRole } from '@/lib/authUtils'; // Import the auth utility
import type { Client, Priority, AuthenticatedUser } from '@/types';

const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\+?[0-9\s-()]*$/, 'Invalid phone number format'),
  requirements: z.string().min(5, 'Requirements must be at least 5 characters'),
  priority: z.enum(['none', '1 month', '2 months', '3 months']) satisfies z.ZodType<Priority>,
});

// GET /api/clients - Fetch all clients for the logged-in user (or all for admin)
export async function GET(request: NextRequest) {
  const authResult = await verifyAuthAndRole(request); // Check authentication
  if (!authResult.user || authResult.response) {
    return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const { userId, role } = authResult.user;

  try {
    const { collections } = await connectToDatabase();

    // Admins see all clients, regular users only see their own
    const query = role === 'admin' ? {} : { userId: userId };

    const clientDocs = await collections.clients.find(query).sort({ createdAt: -1 }).toArray(); // Sort by newest first
    const clients = clientDocs.map(mapMongoId);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ message: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/clients - Create a new client for the logged-in user
export async function POST(request: NextRequest) {
  const authResult = await verifyAuthAndRole(request); // Check authentication
  if (!authResult.user || authResult.response) {
     return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const { userId } = authResult.user; // Get the userId from the verified token

  try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = clientSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid client data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const newClientData = parseResult.data;

    const newClientDocument: Omit<Client, 'id'> = {
      ...newClientData,
      userId: userId, // Associate client with the logged-in user
      createdAt: new Date(),
    };

    const insertResult = await collections.clients.insertOne(newClientDocument);

    if (!insertResult.insertedId) {
      throw new Error('Failed to insert client into database.');
    }

    // Fetch the newly created client to return it with the generated ID
    const createdClientDoc = await collections.clients.findOne({ _id: insertResult.insertedId });

     if (!createdClientDoc) {
        throw new Error('Failed to retrieve created client.');
     }

     const clientResponse = mapMongoId(createdClientDoc);

    return NextResponse.json(clientResponse, { status: 201 });
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ message: 'Failed to create client' }, { status: 500 });
  }
}
