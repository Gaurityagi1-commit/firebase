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

const CLIENTS_KEY = 'clients';

// GET /api/clients/[id] - Fetch a single client by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id;
    const clients: Client[] | null = await kv.get(CLIENTS_KEY);
    const client = clients?.find(c => c.id === clientId);

    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error(`Failed to fetch client ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update a client by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id;
    const body = await request.json();
    const parseResult = clientSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid client data', errors: parseResult.error.errors }, { status: 400 });
    }

    const updatedData = parseResult.data;

    const clients: Client[] | null = await kv.get(CLIENTS_KEY);
    if (!clients) {
        return NextResponse.json({ message: 'Client list not found' }, { status: 500 });
    }

    let clientFound = false;
    const updatedClients = clients.map(client => {
      if (client.id === clientId) {
        clientFound = true;
        // Preserve createdAt and ID, update the rest
        return { ...client, ...updatedData };
      }
      return client;
    });

    if (!clientFound) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    await kv.set(CLIENTS_KEY, updatedClients);
    const updatedClient = updatedClients.find(c => c.id === clientId); // Get the updated client object

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error(`Failed to update client ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete a client by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id;
    const clients: Client[] | null = await kv.get(CLIENTS_KEY);

    if (!clients) {
      return NextResponse.json({ message: 'Client list not found' }, { status: 500 });
    }

    const clientExists = clients.some(c => c.id === clientId);
    if (!clientExists) {
        return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    const updatedClients = clients.filter(client => client.id !== clientId);
    await kv.set(CLIENTS_KEY, updatedClients);

    // TODO: Consider deleting related quotations and reminders?

    return NextResponse.json({ message: 'Client deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete client ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete client' }, { status: 500 });
  }
}
