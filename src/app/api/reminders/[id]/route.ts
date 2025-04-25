import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase, mapMongoId } from '@/lib/mongodb';
import type { Reminder, Client } from '@/types';

// Schema for full update (PUT) - make fields optional
const reminderUpdateSchema = z.object({
  clientId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid client ID format" }).optional(),
  message: z.string().min(5, 'Message must be at least 5 characters').optional(),
  reminderDateTime: z.coerce.date().min(new Date(new Date().setHours(0,0,0,0)), "Reminder date cannot be in the past.").optional(),
  type: z.enum(['email', 'whatsapp', 'meeting', 'follow-up']).optional() satisfies z.ZodType<Reminder['type'] | undefined>,
  completed: z.boolean().optional(), // Allow updating completion via PUT too
}).partial();


// Schema specifically for toggling completion status (PATCH)
const reminderToggleSchema = z.object({
  completed: z.boolean(),
});

function isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id);
}

// GET /api/reminders/[id] - Fetch a single reminder by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const reminderId = params.id;

  if (!isValidObjectId(reminderId)) {
    return NextResponse.json({ message: 'Invalid reminder ID format' }, { status: 400 });
  }

  try {
    const { collections } = await connectToDatabase();
    const reminderDoc = await collections.reminders.findOne({ _id: new ObjectId(reminderId) });

    if (!reminderDoc) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    const reminder = mapMongoId(reminderDoc);
    return NextResponse.json(reminder);
  } catch (error) {
    console.error(`Failed to fetch reminder ${reminderId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch reminder' }, { status: 500 });
  }
}

// PATCH /api/reminders/[id] - Update completion status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
   const reminderId = params.id;

   if (!isValidObjectId(reminderId)) {
       return NextResponse.json({ message: 'Invalid reminder ID format' }, { status: 400 });
   }

   try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = reminderToggleSchema.safeParse(body);

    if (!parseResult.success) {
        return NextResponse.json({ message: 'Invalid data for PATCH. Only { "completed": boolean } is supported.' }, { status: 400 });
    }

    const { completed } = parseResult.data;

    const updateResult = await collections.reminders.findOneAndUpdate(
      { _id: new ObjectId(reminderId) },
      { $set: { completed: completed } },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    const updatedReminder = mapMongoId(updateResult);
    return NextResponse.json(updatedReminder);

  } catch (error) {
    console.error(`Failed to update reminder ${reminderId} status:`, error);
    return NextResponse.json({ message: 'Failed to update reminder status' }, { status: 500 });
  }
}


// PUT /api/reminders/[id] - Full update of a reminder by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
   const reminderId = params.id;

   if (!isValidObjectId(reminderId)) {
     return NextResponse.json({ message: 'Invalid reminder ID format' }, { status: 400 });
   }

   try {
    const { collections } = await connectToDatabase();
    const body = await request.json();
    const parseResult = reminderUpdateSchema.safeParse(body); // Use the update schema

    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid reminder data', errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const updateData = parseResult.data;

     if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    // If clientId is being updated, fetch the new client's name
    let clientNameUpdate = {};
    if (updateData.clientId) {
       const newClientDoc = await collections.clients.findOne({ _id: new ObjectId(updateData.clientId) });
        if (!newClientDoc) {
            return NextResponse.json({ message: 'Updated client ID not found' }, { status: 404 });
        }
        clientNameUpdate = { clientName: newClientDoc.name };
    }

    // Ensure date is stored as Date object if provided
    const finalUpdateData: any = { ...updateData, ...clientNameUpdate };
    if (finalUpdateData.reminderDateTime) {
        finalUpdateData.reminderDateTime = new Date(finalUpdateData.reminderDateTime);
    }


    const updateResult = await collections.reminders.findOneAndUpdate(
      { _id: new ObjectId(reminderId) },
      { $set: finalUpdateData },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    const updatedReminder = mapMongoId(updateResult);
    return NextResponse.json(updatedReminder);

  } catch (error) {
    console.error(`Failed to update reminder ${reminderId}:`, error);
    return NextResponse.json({ message: 'Failed to update reminder' }, { status: 500 });
  }
}

// DELETE /api/reminders/[id] - Delete a reminder by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const reminderId = params.id;

  if (!isValidObjectId(reminderId)) {
    return NextResponse.json({ message: 'Invalid reminder ID format' }, { status: 400 });
  }

  try {
    const { collections } = await connectToDatabase();
    const deleteResult = await collections.reminders.deleteOne({ _id: new ObjectId(reminderId) });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Reminder deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete reminder ${reminderId}:`, error);
    return NextResponse.json({ message: 'Failed to delete reminder' }, { status: 500 });
  }
}
