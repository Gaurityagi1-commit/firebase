import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { Reminder, Client } from '@/types';
import { z } from 'zod';

// Schema for full update
const reminderUpdateSchema = z.object({
  clientId: z.string().min(1).optional(), // Allow changing client?
  message: z.string().min(5).optional(),
  reminderDateTime: z.coerce.date().optional(),
  type: z.enum(['email', 'whatsapp', 'meeting', 'follow-up']).optional(),
  completed: z.boolean().optional(),
});

// Schema specifically for toggling completion status
const reminderToggleSchema = z.object({
  completed: z.boolean(),
});


const REMINDERS_KEY = 'reminders';
const CLIENTS_KEY = 'clients';

// GET /api/reminders/[id] - Fetch a single reminder by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reminderId = params.id;
    const reminders: Reminder[] | null = await kv.get(REMINDERS_KEY);
    const reminder = reminders?.find(r => r.id === reminderId);

    if (!reminder) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error(`Failed to fetch reminder ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch reminder' }, { status: 500 });
  }
}

// PATCH /api/reminders/[id] - Update a reminder by ID (e.g., toggle complete)
// Using PATCH for partial updates like toggling status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
   try {
    const reminderId = params.id;
    const body = await request.json();
    // Try parsing as a simple toggle first
    const toggleParseResult = reminderToggleSchema.safeParse(body);

    if (!toggleParseResult.success) {
         // If not a simple toggle, maybe it's a full update? Or return error?
         // For simplicity, let's assume PATCH is only for toggling 'completed' here.
         // You could expand this to handle other partial updates.
        return NextResponse.json({ message: 'Invalid data for PATCH. Only { "completed": boolean } is supported.' }, { status: 400 });
    }

    const { completed } = toggleParseResult.data;

    const reminders: Reminder[] | null = await kv.get(REMINDERS_KEY);
    if (!reminders) {
        return NextResponse.json({ message: 'Reminder list not found' }, { status: 500 });
    }

    let reminderFound = false;
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === reminderId) {
        reminderFound = true;
        return { ...reminder, completed: completed };
      }
      return reminder;
    });

    if (!reminderFound) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    await kv.set(REMINDERS_KEY, updatedReminders);
    const updatedReminder = updatedReminders.find(r => r.id === reminderId);

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error(`Failed to update reminder ${params.id} status:`, error);
    return NextResponse.json({ message: 'Failed to update reminder status' }, { status: 500 });
  }
}


// PUT /api/reminders/[id] - Full update of a reminder by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
   try {
    const reminderId = params.id;
    const body = await request.json();
    const parseResult = reminderUpdateSchema.safeParse(body); // Use the update schema

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid reminder data', errors: parseResult.error.errors }, { status: 400 });
    }

    const updatedData = parseResult.data;

    const reminders: Reminder[] | null = await kv.get(REMINDERS_KEY);
    if (!reminders) {
        return NextResponse.json({ message: 'Reminder list not found' }, { status: 500 });
    }

    let reminderFound = false;
    let originalClientName = ''; // Keep track if client changes

    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === reminderId) {
        reminderFound = true;
        originalClientName = reminder.clientName;
        // Preserve createdAt, ID
        return {
            ...reminder, // Start with existing reminder
            ...updatedData, // Apply updates
            // clientName needs potential update if clientId changed
            clientName: updatedData.clientId && updatedData.clientId !== reminder.clientId
                       ? '...' // Placeholder, will update below if needed
                       : originalClientName,
        };
      }
      return reminder;
    });

    if (!reminderFound) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    // Update clientName if clientId changed
    const potentiallyUpdatedReminder = updatedReminders.find(r => r.id === reminderId)!;
    if (updatedData.clientId && updatedData.clientId !== potentiallyUpdatedReminder.clientId) {
       const clients: Client[] | null = await kv.get(CLIENTS_KEY);
       const newClient = clients?.find(c => c.id === updatedData.clientId);
        if (!newClient) {
            return NextResponse.json({ message: 'Updated client ID not found' }, { status: 400 });
        }
        // Update the clientName in the mapped array
        potentiallyUpdatedReminder.clientName = newClient.name;
    }

    await kv.set(REMINDERS_KEY, updatedReminders);
    const finalUpdatedReminder = updatedReminders.find(r => r.id === reminderId);

    return NextResponse.json(finalUpdatedReminder);
  } catch (error) {
    console.error(`Failed to update reminder ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update reminder' }, { status: 500 });
  }
}

// DELETE /api/reminders/[id] - Delete a reminder by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reminderId = params.id;
    const reminders: Reminder[] | null = await kv.get(REMINDERS_KEY);

     if (!reminders) {
      return NextResponse.json({ message: 'Reminder list not found' }, { status: 500 });
    }

    const reminderExists = reminders.some(r => r.id === reminderId);
    if (!reminderExists) {
        return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    const updatedReminders = reminders.filter(reminder => reminder.id !== reminderId);
    await kv.set(REMINDERS_KEY, updatedReminders);

    return NextResponse.json({ message: 'Reminder deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete reminder ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete reminder' }, { status: 500 });
  }
}
