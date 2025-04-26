import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import { verifyAuthAndRole } from '@/lib/authUtils'; // Import auth utility
import type { Quotation, Client, AuthenticatedUser } from '@/types';

// Schema for updating (all fields optional)
const quotationUpdateSchema = z.object({
  clientId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid client ID format" }).optional(),
  details: z.string().min(10, 'Details must be at least 10 characters').optional(),
  amount: z.coerce.number().positive('Amount must be a positive number').optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']).optional() satisfies z.ZodType<Quotation['status'] | undefined>,
}).partial(); // Makes all fields optional


function isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id);
}

// Helper to find quotation and check ownership/admin role
async function findQuotationAndCheckAccess(quotationId: string, user: AuthenticatedUser): Promise<{ quotationDoc: Omit<Quotation, 'id'> & { _id: ObjectId } | null, response?: NextResponse }> {
    if (!isValidObjectId(quotationId)) {
        return { quotationDoc: null, response: NextResponse.json({ message: 'Invalid quotation ID format' }, { status: 400 }) };
    }

    const { collections } = await connectToDatabase();
    const quotationDoc = await collections.quotations.findOne({ _id: new ObjectId(quotationId) });

    if (!quotationDoc) {
        return { quotationDoc: null, response: NextResponse.json({ message: 'Quotation not found' }, { status: 404 }) };
    }

    // Check ownership or admin role
    if (user.role !== 'admin' && quotationDoc.userId !== user.userId) {
        return { quotationDoc: null, response: NextResponse.json({ message: 'Forbidden: You do not own this quotation' }, { status: 403 }) };
    }

    return { quotationDoc };
}

// GET /api/quotations/[id] - Fetch a single quotation by ID (Requires ownership or admin role)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifyAuthAndRole(request);
    if (!authResult.user || authResult.response) {
        return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const quotationId = params.id;

    try {
        const { quotationDoc, response } = await findQuotationAndCheckAccess(quotationId, authResult.user);
        if (response) return response;
        if (!quotationDoc) return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });

        const quotation = mapMongoId(quotationDoc);
        return NextResponse.json(quotation);
    } catch (error) {
        console.error(`Failed to fetch quotation ${quotationId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch quotation' }, { status: 500 });
    }
}

// PUT /api/quotations/[id] - Update a quotation by ID (Requires ownership or admin role)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifyAuthAndRole(request);
    if (!authResult.user || authResult.response) {
        return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
     const { userId, role } = authResult.user;

    const quotationId = params.id;

    try {
        const { quotationDoc, response: accessResponse } = await findQuotationAndCheckAccess(quotationId, authResult.user);
        if (accessResponse) return accessResponse;
        if (!quotationDoc) return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });


        const { collections } = await connectToDatabase();
        const body = await request.json();
        const parseResult = quotationUpdateSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({ message: 'Invalid quotation data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
        }

        const updateData = parseResult.data;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
        }

        // If clientId is being updated, fetch the new client's name AND verify ownership/admin access
        let clientNameUpdate = {};
        if (updateData.clientId) {
            const newClientDoc = await collections.clients.findOne({ _id: new ObjectId(updateData.clientId) });
            if (!newClientDoc) {
                return NextResponse.json({ message: 'Updated client ID not found' }, { status: 404 });
            }
             // Ensure the user owns the *new* client or is an admin
             if (role !== 'admin' && newClientDoc.userId !== userId) {
                 return NextResponse.json({ message: 'Forbidden: You do not own the newly associated client' }, { status: 403 });
            }
            clientNameUpdate = { clientName: newClientDoc.name };
        }

        const finalUpdateData = { ...updateData, ...clientNameUpdate };

        const updateResult = await collections.quotations.findOneAndUpdate(
            { _id: new ObjectId(quotationId) },
            { $set: finalUpdateData },
            { returnDocument: 'after' }
        );

        if (!updateResult) {
            return NextResponse.json({ message: 'Quotation not found during update' }, { status: 404 });
        }

        const updatedQuotation = mapMongoId(updateResult);
        return NextResponse.json(updatedQuotation);

    } catch (error) {
        console.error(`Failed to update quotation ${quotationId}:`, error);
        return NextResponse.json({ message: 'Failed to update quotation' }, { status: 500 });
    }
}

// DELETE /api/quotations/[id] - Delete a quotation by ID (Requires ownership or admin role)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await verifyAuthAndRole(request);
    if (!authResult.user || authResult.response) {
        return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const quotationId = params.id;

    try {
        const { quotationDoc, response: accessResponse } = await findQuotationAndCheckAccess(quotationId, authResult.user);
        if (accessResponse) return accessResponse;
         if (!quotationDoc) return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });

        const { collections } = await connectToDatabase();
        const deleteResult = await collections.quotations.deleteOne({ _id: new ObjectId(quotationId) });

        if (deleteResult.deletedCount === 0) {
             return NextResponse.json({ message: 'Quotation not found during delete' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Quotation deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete quotation ${quotationId}:`, error);
        return NextResponse.json({ message: 'Failed to delete quotation' }, { status: 500 });
    }
}
