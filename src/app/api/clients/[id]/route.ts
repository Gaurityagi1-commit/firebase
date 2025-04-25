import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import type { Client, Priority } from '@/types';

// Re-use the schema, make fields optional for PUT
const clientUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\+?[0-9\s-()]*$/, 'Invalid phone number format').optional(),
  requirements: z.string().min(5, 'Requirements must be at least 5 characters').optional(),
  priority: z.enum(['none', '1 month', '2 months', '3 months']).optional() satisfies z.ZodType<Priority | undefined>,
}).partial(); // Makes all fields optional


function isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id);
}

// GET /api/clients/[id] - Fetch a single client by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const clientId = params.id;

  if (!isValidObjectId(clientId)) {
      return NextResponse.json({ message: 'Invalid client ID format' }, { status: 400 });
  }

  try {
    const { collections } = await connectToDatabase();
    const clientDoc = await collections.clients.findOne({ _id: new ObjectId(clientId) });

    if (!clientDoc) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    const client = mapMongoId(clientDoc);
    return NextResponse.json(client);
  } catch (error) {
    console.error(`Failed to fetch client ${clientId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update a client by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const clientId = params.id;

  if (!isValidObjectId(clientId)) {
      return NextResponse.json({ message: 'Invalid client ID format' }, { status: 400 });
  }

  try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = clientUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid client data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const updateData = parseResult.data;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    const updateResult = await collections.clients.findOneAndUpdate(
      { _id: new ObjectId(clientId) },
      { $set: updateData },
      { returnDocument: 'after' } // Return the updated document
    );

    if (!updateResult) { // findOneAndUpdate returns null if no document matched
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    const updatedClient = mapMongoId(updateResult); // updateResult is the updated doc
    return NextResponse.json(updatedClient);

  } catch (error) {
    console.error(`Failed to update client ${clientId}:`, error);
    return NextResponse.json({ message: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete a client by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const clientId = params.id;

   if (!isValidObjectId(clientId)) {
      return NextResponse.json({ message: 'Invalid client ID format' }, { status: 400 });
  }

  try {
    const { collections } = await connectToDatabase();

    const deleteResult = await collections.clients.deleteOne({ _id: new ObjectId(clientId) });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    // TODO: Consider deleting related quotations and reminders?
    // Example (needs error handling):
    // await collections.quotations.deleteMany({ clientId: clientId }); // Use string ID here if stored as string
    // await collections.reminders.deleteMany({ clientId: clientId });

    return NextResponse.json({ message: 'Client deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete client ${clientId}:`, error);
    return NextResponse.json({ message: 'Failed to delete client' }, { status: 500 });
  }
}
