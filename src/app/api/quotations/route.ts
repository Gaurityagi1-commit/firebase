import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import { verifyAuthAndRole } from '@/lib/authUtils'; // Import auth utility
import type { Quotation, Client, AuthenticatedUser } from '@/types';

const quotationSchema = z.object({
  clientId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid client ID format" }), // Validate ObjectId string
  details: z.string().min(10, 'Details must be at least 10 characters'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']) satisfies z.ZodType<Quotation['status']>,
});

// GET /api/quotations - Fetch all quotations for the logged-in user (or all for admin)
export async function GET(request: NextRequest) {
    const authResult = await verifyAuthAndRole(request);
    if (!authResult.user || authResult.response) {
        return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    const { userId, role } = authResult.user;

    try {
        const { collections } = await connectToDatabase();

        // Admins see all quotations, users only see their own
        const query = role === 'admin' ? {} : { userId: userId };

        const quotationDocs = await collections.quotations.find(query).sort({ createdAt: -1 }).toArray();
        const quotations = quotationDocs.map(mapMongoId);
        return NextResponse.json(quotations);
    } catch (error) {
        console.error('Failed to fetch quotations:', error);
        return NextResponse.json({ message: 'Failed to fetch quotations' }, { status: 500 });
    }
}

// POST /api/quotations - Create a new quotation for the logged-in user
export async function POST(request: NextRequest) {
    const authResult = await verifyAuthAndRole(request);
    if (!authResult.user || authResult.response) {
        return authResult.response ?? NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    const { userId, role } = authResult.user; // Get userId

    try {
        const { collections } = await connectToDatabase();
        const body = await request.json();
        const parseResult = quotationSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({ message: 'Invalid quotation data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
        }

        const newQuotationData = parseResult.data;

        // Fetch client name for denormalization AND verify ownership/admin access
        const clientDoc = await collections.clients.findOne({ _id: new ObjectId(newQuotationData.clientId) });

        if (!clientDoc) {
            return NextResponse.json({ message: 'Associated client not found' }, { status: 404 });
        }
        // Ensure the user owns the client or is an admin
        if (role !== 'admin' && clientDoc.userId !== userId) {
             return NextResponse.json({ message: 'Forbidden: You do not own the associated client' }, { status: 403 });
        }


        const newQuotationDocument: Omit<Quotation, 'id'> = {
            userId: userId, // Associate quotation with the user
            clientId: newQuotationData.clientId, // Store as string ObjectId
            clientName: clientDoc.name, // Store client name directly
            details: newQuotationData.details,
            amount: newQuotationData.amount,
            status: newQuotationData.status,
            createdAt: new Date(),
        };

        const insertResult = await collections.quotations.insertOne(newQuotationDocument);

        if (!insertResult.insertedId) {
            throw new Error('Failed to insert quotation into database.');
        }

        // Fetch the newly created quotation
        const createdQuotationDoc = await collections.quotations.findOne({ _id: insertResult.insertedId });
        if (!createdQuotationDoc) {
            throw new Error('Failed to retrieve created quotation.');
        }
        const quotationResponse = mapMongoId(createdQuotationDoc);

        return NextResponse.json(quotationResponse, { status: 201 });
    } catch (error) {
        console.error('Failed to create quotation:', error);
        return NextResponse.json({ message: 'Failed to create quotation' }, { status: 500 });
    }
}
