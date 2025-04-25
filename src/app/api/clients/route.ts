import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { Client } from '@/types';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  requirements: z.string().min(5),
  priority: z.enum(['none', '1 month', '2 months', '3 months']),
});

const CLIENTS_KEY = 'clients'; // Key for storing clients in KV

// GET /api/clients - Fetch all clients
export async function GET(request: NextRequest) {
  try {
    const clients: Client[] | null = await kv.get(CLIENTS_KEY);
    return NextResponse.json(clients || []);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ message: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = clientSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid client data', errors: parseResult.error.errors }, { status: 400 });
    }

    const newClientData = parseResult.data;

    const newClient: Client = {
      id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      ...newClientData,
      createdAt: new Date(),
    };

    // Fetch existing clients, add the new one, and save back
    const existingClients: Client[] = (await kv.get(CLIENTS_KEY)) || [];
    const updatedClients = [...existingClients, newClient];

    await kv.set(CLIENTS_KEY, updatedClients);

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ message: 'Failed to create client' }, { status: 500 });
  }
}
