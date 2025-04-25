import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import type { Reminder, Client } from '@/types';

const reminderSchema = z.object({
  clientId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid client ID format" }),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  reminderDateTime: z.coerce.date().min(new Date(new Date().setHours(0, 0, 0, 0)), "Reminder date cannot be in the past."), // Use coerce and add past date validation
  type: z.enum(['email', 'whatsapp', 'meeting', 'follow-up']) satisfies z.ZodType<Reminder['type']>,
});

// GET /api/reminders - Fetch all reminders
export async function GET(request: NextRequest) {
  try {
    const { collections } = await connectToDatabase();
    // Sort by upcoming date first, then maybe creation date
    const reminderDocs = await collections.reminders.find({})
                         .sort({ reminderDateTime: 1, createdAt: -1 })
                         .toArray();
    const reminders = reminderDocs.map(mapMongoId);
    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Failed to fetch reminders:', error);
    return NextResponse.json({ message: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = reminderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid reminder data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const newReminderData = parseResult.data;

    // Fetch client name for denormalization
    const clientDoc = await collections.clients.findOne({ _id: new ObjectId(newReminderData.clientId) });
    if (!clientDoc) {
      return NextResponse.json({ message: 'Associated client not found' }, { status: 404 });
    }

    const newReminderDocument: Omit<Reminder, 'id'> = {
      clientId: newReminderData.clientId, // Store as string ObjectId
      clientName: clientDoc.name,
      message: newReminderData.message,
      reminderDateTime: newReminderData.reminderDateTime, // Already a Date object from coercion
      type: newReminderData.type,
      completed: false, // Default status
      createdAt: new Date(),
    };

    const insertResult = await collections.reminders.insertOne(newReminderDocument);

     if (!insertResult.insertedId) {
       throw new Error('Failed to insert reminder into database.');
     }

     // Fetch the newly created reminder
      const createdReminderDoc = await collections.reminders.findOne({ _id: insertResult.insertedId });
      if (!createdReminderDoc) {
          throw new Error('Failed to retrieve created reminder.');
      }
      const reminderResponse = mapMongoId(createdReminderDoc);

    // TODO: Trigger actual notification scheduling (e.g., call external service, queue job)
    console.log("Reminder saved, would trigger notification for:", reminderResponse);

    return NextResponse.json(reminderResponse, { status: 201 });
  } catch (error) {
    console.error('Failed to create reminder:', error);
    return NextResponse.json({ message: 'Failed to create reminder' }, { status: 500 });
  }
}
