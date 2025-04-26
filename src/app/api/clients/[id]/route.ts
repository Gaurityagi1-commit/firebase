import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import { verifyAuthAndRole } from '@/lib/authUtils'; // Import auth utility
import type { Client, Priority, AuthenticatedUser } from '@/types';

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

// Helper to find client and check ownership/admin role
async function findClientAndCheckAccess(clientId: string, user: AuthenticatedUser): Promise<{ clientDoc: Omit<Client, 'id'> & { _id: ObjectId } | null, response?: NextResponse }> {
    if (!isValidObjectId(clientId)) {
        return { clientDoc: null, response: NextResponse.json({ message: 'Invalid client ID format' }, { status: 400 }) };
    }

    const { collections } = await connectToDatabase();
    const clientDoc = await collections.clients.findOne({ _id: new ObjectId(clientId) });

    if (!clientDoc) {
        return { clientDoc: null, response: NextResponse.json({ message: 'Client not found' }, { status: 404 }) };
    }

    // Check ownership or admin role
    if (user.role !== 'admin' && clientDoc.userId !== user.userId) {
        return { clientDoc: null, response: NextResponse.json({ message: 'Forbidden: You do not own this client' }, { status: 403 }) };
    }

    return { clientDoc };
}


// GET /api/clients/[id] - Fetch a single client by ID (Requires ownership or admin role)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await verifyAuthAndRole(request);
  if (!authResult.user || authResult.response) {
    return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const clientId = params.id;

  try {
      const { clientDoc, response } = await findClientAndCheckAccess(clientId, authResult.user);
      if (response) return response;
      if (!clientDoc) return NextResponse.json({ message: 'Client not found' }, { status: 404 }); // Should be caught by helper, but safeguard

      const client = mapMongoId(clientDoc);
      return NextResponse.json(client);
  } catch (error) {
    console.error(`Failed to fetch client ${clientId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update a client by ID (Requires ownership or admin role)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await verifyAuthAndRole(request);
  if (!authResult.user || authResult.response) {
    return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const clientId = params.id;

  try {
      const { clientDoc, response: accessResponse } = await findClientAndCheckAccess(clientId, authResult.user);
      if (accessResponse) return accessResponse;
      if (!clientDoc) return NextResponse.json({ message: 'Client not found' }, { status: 404 });


      const { collections } = await connectToDatabase(); // connectToDatabase is called within findClientAndCheckAccess, reuse if possible
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
        { _id: new ObjectId(clientId) }, // Query by _id
        { $set: updateData },
        { returnDocument: 'after' } // Return the updated document
      );

      if (!updateResult) { // Should not happen if findOne worked, but check anyway
        return NextResponse.json({ message: 'Client not found during update' }, { status: 404 });
      }

      const updatedClient = mapMongoId(updateResult); // updateResult is the updated doc
      return NextResponse.json(updatedClient);

  } catch (error) {
    console.error(`Failed to update client ${clientId}:`, error);
    return NextResponse.json({ message: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete a client by ID (Requires ownership or admin role)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifyAuthAndRole(request);
    if (!authResult.user || authResult.response) {
        return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const clientId = params.id;

    try {
        const { clientDoc, response: accessResponse } = await findClientAndCheckAccess(clientId, authResult.user);
        if (accessResponse) return accessResponse;
        if (!clientDoc) return NextResponse.json({ message: 'Client not found' }, { status: 404 });

        const { collections } = await connectToDatabase();

        // Delete the client itself
        const deleteClientResult = await collections.clients.deleteOne({ _id: new ObjectId(clientId) });

        if (deleteClientResult.deletedCount === 0) {
            // Should not happen if findOne worked
            return NextResponse.json({ message: 'Client not found during delete' }, { status: 404 });
        }

        // Also delete related quotations and reminders for this client
        // Use the string ID stored in quotations/reminders
        await Promise.all([
            collections.quotations.deleteMany({ clientId: clientId }),
            collections.reminders.deleteMany({ clientId: clientId })
        ]);
        console.log(`Deleted client ${clientId} and associated quotations/reminders.`);


        return NextResponse.json({ message: 'Client and associated data deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete client ${clientId}:`, error);
        return NextResponse.json({ message: 'Failed to delete client' }, { status: 500 });
    }
}
