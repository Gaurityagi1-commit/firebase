import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { Reminder, Client } from '@/types';
import { z } from 'zod';

const reminderSchema = z.object({
  clientId: z.string().min(1),
  message: z.string().min(5),
  // Ensure date is received correctly, might need coercion depending on client format
  reminderDateTime: z.coerce.date(),
  type: z.enum(['email', 'whatsapp', 'meeting', 'follow-up']),
  // Completed status defaults to false on creation
});

const REMINDERS_KEY = 'reminders';
const CLIENTS_KEY = 'clients';

// GET /api/reminders - Fetch all reminders
export async function GET(request: NextRequest) {
  try {
    const reminders: Reminder[] | null = await kv.get(REMINDERS_KEY);
    // Add sorting here if needed, e.g., by reminderDateTime
    const sortedReminders = (reminders || []).sort((a, b) =>
        new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime()
    );
    return NextResponse.json(sortedReminders);
  } catch (error) {
    console.error('Failed to fetch reminders:', error);
    return NextResponse.json({ message: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = reminderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid reminder data', errors: parseResult.error.errors }, { status: 400 });
    }

    const newReminderData = parseResult.data;

     // Validate reminder date is not in the past (optional server-side check)
    if (newReminderData.reminderDateTime < new Date()) {
        // Allow buffer? Or strict past check?
        // return NextResponse.json({ message: 'Reminder date cannot be in the past' }, { status: 400 });
    }

    // Fetch client name for denormalization
    const clients: Client[] | null = await kv.get(CLIENTS_KEY);
    const client = clients?.find(c => c.id === newReminderData.clientId);

    if (!client) {
      return NextResponse.json({ message: 'Associated client not found' }, { status: 404 });
    }

    const newReminder: Reminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...newReminderData,
      clientName: client.name,
      completed: false, // Default status
      createdAt: new Date(),
    };

    const existingReminders: Reminder[] = (await kv.get(REMINDERS_KEY)) || [];
    const updatedReminders = [...existingReminders, newReminder];

    await kv.set(REMINDERS_KEY, updatedReminders);

    // TODO: Trigger actual notification scheduling (e.g., call external service, queue job)
    // This example just saves the reminder data.
    console.log("Reminder saved, would trigger notification for:", newReminder);

    return NextResponse.json(newReminder, { status: 201 });
  } catch (error) {
    console.error('Failed to create reminder:', error);
    return NextResponse.json({ message: 'Failed to create reminder' }, { status: 500 });
  }
}
