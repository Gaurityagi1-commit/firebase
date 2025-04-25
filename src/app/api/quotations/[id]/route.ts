import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { Quotation, Client } from '@/types';
import { z } from 'zod';

const quotationSchema = z.object({
  // Client ID shouldn't change on update typically, but might be needed for validation
  clientId: z.string().min(1).optional(), // Optional on update? Or enforce? Decide based on requirements.
  details: z.string().min(10),
  amount: z.coerce.number().positive(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
});

const QUOTATIONS_KEY = 'quotations';
const CLIENTS_KEY = 'clients';

// GET /api/quotations/[id] - Fetch a single quotation by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quotationId = params.id;
    const quotations: Quotation[] | null = await kv.get(QUOTATIONS_KEY);
    const quotation = quotations?.find(q => q.id === quotationId);

    if (!quotation) {
      return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error(`Failed to fetch quotation ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch quotation' }, { status: 500 });
  }
}

// PUT /api/quotations/[id] - Update a quotation by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quotationId = params.id;
    const body = await request.json();
    // Use partial schema for update, as not all fields might be sent
    const parseResult = quotationSchema.partial().safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid quotation data', errors: parseResult.error.errors }, { status: 400 });
    }

    const updatedData = parseResult.data;

    const quotations: Quotation[] | null = await kv.get(QUOTATIONS_KEY);
     if (!quotations) {
        return NextResponse.json({ message: 'Quotation list not found' }, { status: 500 });
    }

    let quotationFound = false;
    let clientName = ''; // To store original client name if clientId doesn't change

    const updatedQuotations = quotations.map(quotation => {
      if (quotation.id === quotationId) {
        quotationFound = true;
        clientName = quotation.clientName; // Keep original name if client doesn't change
        // Preserve createdAt, ID, potentially clientName if clientId not in updatedData
        return {
            ...quotation,
            ...updatedData,
            // If clientId changes, we might need to update clientName - requires fetching clients again
            // For simplicity here, we assume clientName is updated only if explicitly provided or clientId changes
            // A more robust solution might re-fetch client name if clientId is in updatedData
            clientName: updatedData.clientId ? '...' : clientName // Placeholder if client changes
        };
      }
      return quotation;
    });

    if (!quotationFound) {
      return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });
    }

    // If clientId changed, fetch new client name (Example - more complex logic)
    // This part adds complexity and might be better handled depending on requirements
    if (updatedData.clientId) {
       const clients: Client[] | null = await kv.get(CLIENTS_KEY);
       const newClient = clients?.find(c => c.id === updatedData.clientId);
        if (!newClient) {
            return NextResponse.json({ message: 'Updated client ID not found' }, { status: 400 });
        }
        updatedQuotations.forEach(q => {
            if(q.id === quotationId) {
                q.clientName = newClient.name;
            }
        })
    }


    await kv.set(QUOTATIONS_KEY, updatedQuotations);
    const updatedQuotation = updatedQuotations.find(q => q.id === quotationId);


    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error(`Failed to update quotation ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update quotation' }, { status: 500 });
  }
}

// DELETE /api/quotations/[id] - Delete a quotation by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quotationId = params.id;
    const quotations: Quotation[] | null = await kv.get(QUOTATIONS_KEY);

     if (!quotations) {
      return NextResponse.json({ message: 'Quotation list not found' }, { status: 500 });
    }

    const quotationExists = quotations.some(q => q.id === quotationId);
    if (!quotationExists) {
        return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });
    }

    const updatedQuotations = quotations.filter(quotation => quotation.id !== quotationId);
    await kv.set(QUOTATIONS_KEY, updatedQuotations);

    return NextResponse.json({ message: 'Quotation deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete quotation ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete quotation' }, { status: 500 });
  }
}
