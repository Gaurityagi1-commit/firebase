import type { Reminder } from '@/types';

const API_BASE_URL = '/api/reminders';

// Type for data needed to create a reminder
export type ReminderInputData = Omit<Reminder, 'id' | 'createdAt' | 'clientName' | 'completed'>;

// Type for data needed to update a reminder (can be partial)
export type ReminderUpdateData = Partial<Omit<Reminder, 'id' | 'createdAt' | 'clientName'>>;

export async function getReminders(): Promise<Reminder[]> {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch reminders');
  }
  const data = await response.json();
   // Ensure dates are parsed correctly
  return data.map((reminder: any) => ({
    ...reminder,
    reminderDateTime: new Date(reminder.reminderDateTime),
    createdAt: new Date(reminder.createdAt),
  }));
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch reminder ${id}`);
  }
  const data = await response.json();
   return {
       ...data,
       reminderDateTime: new Date(data.reminderDateTime),
       createdAt: new Date(data.createdAt)
   };
}

export async function createReminder(reminderData: ReminderInputData): Promise<Reminder> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Ensure date is sent in a format the backend expects (ISO string is usually safe)
    body: JSON.stringify({
        ...reminderData,
        reminderDateTime: reminderData.reminderDateTime.toISOString(),
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create reminder' }));
    console.error("Create reminder error response:", errorData);
    throw new Error(errorData.message || 'Failed to create reminder');
  }
   const data = await response.json();
    return {
       ...data,
       reminderDateTime: new Date(data.reminderDateTime),
       createdAt: new Date(data.createdAt)
   };
}

export async function updateReminder(id: string, reminderData: ReminderUpdateData): Promise<Reminder> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    // Use PUT for full updates as defined in the API route
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    // Send date as ISO string if present
    body: JSON.stringify({
        ...reminderData,
        ...(reminderData.reminderDateTime && { reminderDateTime: reminderData.reminderDateTime.toISOString() }),
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to update reminder ${id}` }));
    console.error("Update reminder error response:", errorData);
    throw new Error(errorData.message || `Failed to update reminder ${id}`);
  }
  const data = await response.json();
   return {
       ...data,
       reminderDateTime: new Date(data.reminderDateTime),
       createdAt: new Date(data.createdAt)
   };
}

// Specific function to toggle completion status using PATCH
export async function toggleReminderCompletion(id: string, completed: boolean): Promise<Reminder> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to toggle reminder ${id}` }));
      console.error("Toggle reminder error response:", errorData);
      throw new Error(errorData.message || `Failed to toggle reminder ${id}`);
    }
    const data = await response.json();
     return {
         ...data,
         reminderDateTime: new Date(data.reminderDateTime),
         createdAt: new Date(data.createdAt)
     };
}


export async function deleteReminder(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to delete reminder ${id}` }));
    console.error("Delete reminder error response:", errorData);
    throw new Error(errorData.message || `Failed to delete reminder ${id}`);
  }
}
