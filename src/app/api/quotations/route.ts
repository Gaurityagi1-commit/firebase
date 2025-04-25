import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { Quotation, Client } from '@/types';
import { z } from 'zod';

const quotationSchema = z.object({
  clientId: z.string().min(1),
  details: z.string().min(10),
  amount: z.coerce.number().positive(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
});

const QUOTATIONS_KEY = 'quotations';
const CLIENTS_KEY = 'clients';

// GET /api/quotations - Fetch all quotations
export async function GET(request: NextRequest) {
  try {
    const quotations: Quotation[] | null = await kv.get(QUOTATIONS_KEY);
    return NextResponse.json(quotations || []);
  } catch (error) {
    console.error('Failed to fetch quotations:', error);
    return NextResponse.json({ message: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST /api/quotations - Create a new quotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = quotationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid quotation data', errors: parseResult.error.errors }, { status: 400 });
    }

    const newQuotationData = parseResult.data;

    // Fetch client name for denormalization
    const clients: Client[] | null = await kv.get(CLIENTS_KEY);
    const client = clients?.find(c => c.id === newQuotationData.clientId);

    if (!client) {
      return NextResponse.json({ message: 'Associated client not found' }, { status: 404 });
    }

    const newQuotation: Quotation = {
      id: `quo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...newQuotationData,
      clientName: client.name, // Store client name directly
      createdAt: new Date(),
    };

    const existingQuotations: Quotation[] = (await kv.get(QUOTATIONS_KEY)) || [];
    const updatedQuotations = [...existingQuotations, newQuotation];

    await kv.set(QUOTATIONS_KEY, updatedQuotations);

    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error) {
    console.error('Failed to create quotation:', error);
    return NextResponse.json({ message: 'Failed to create quotation' }, { status: 500 });
  }
}
