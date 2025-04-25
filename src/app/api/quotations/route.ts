import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import type { Quotation, Client } from '@/types';

const quotationSchema = z.object({
  clientId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid client ID format" }), // Validate ObjectId string
  details: z.string().min(10, 'Details must be at least 10 characters'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']) satisfies z.ZodType<Quotation['status']>,
});

// GET /api/quotations - Fetch all quotations
export async function GET(request: NextRequest) {
  try {
    const { collections } = await connectToDatabase();
    // Optionally add sorting
    const quotationDocs = await collections.quotations.find({}).sort({ createdAt: -1 }).toArray();
    const quotations = quotationDocs.map(mapMongoId);
    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Failed to fetch quotations:', error);
    return NextResponse.json({ message: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST /api/quotations - Create a new quotation
export async function POST(request: NextRequest) {
  try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = quotationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid quotation data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const newQuotationData = parseResult.data;

    // Fetch client name for denormalization
    const clientDoc = await collections.clients.findOne({ _id: new ObjectId(newQuotationData.clientId) });

    if (!clientDoc) {
      return NextResponse.json({ message: 'Associated client not found' }, { status: 404 });
    }

    const newQuotationDocument: Omit<Quotation, 'id'> = {
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
