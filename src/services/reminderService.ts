import type { Reminder } from '@/types';

const API_BASE_URL = '/api/reminders';

// Type for data needed to create a reminder (matches Zod schema in API)
export type ReminderInputData = Omit<Reminder, 'id' | 'createdAt' | 'clientName' | 'completed'>;

// Type for data needed to update a reminder (matches Zod schema in API)
export type ReminderUpdateData = Partial<Omit<Reminder, 'id' | 'createdAt' | 'clientName'>>;


/**
 * Fetches all reminders from the API.
 * Assumes the API returns dates as ISO strings.
 */
export async function getReminders(): Promise<Reminder[]> {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reminders' }));
    throw new Error(errorData.message || 'Failed to fetch reminders');
  }
  const data = await response.json();
  // Convert date strings to Date objects on the client-side for consistency
  return data.map((reminder: any) => ({
    ...reminder,
    reminderDateTime: new Date(reminder.reminderDateTime),
    createdAt: new Date(reminder.createdAt),
  }));
}

/**
 * Fetches a single reminder by ID.
 * Assumes the API returns dates as ISO strings.
 */
export async function getReminderById(id: string): Promise<Reminder | null> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorData = await response.json().catch(() => ({ message: `Failed to fetch reminder ${id}` }));
    throw new Error(errorData.message || `Failed to fetch reminder ${id}`);
  }
  const data = await response.json();
  // Convert date strings to Date objects
   return {
       ...data,
       reminderDateTime: new Date(data.reminderDateTime),
       createdAt: new Date(data.createdAt)
   };
}

/**
 * Creates a new reminder. Sends Date as ISO string.
 * Assumes the API returns the created reminder with dates as ISO strings.
 */
export async function createReminder(reminderData: ReminderInputData): Promise<Reminder> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Ensure date is sent in a format the backend expects (ISO string is usually safe)
    body: JSON.stringify({
        ...reminderData,
        // Send Date object as ISO string
        reminderDateTime: reminderData.reminderDateTime instanceof Date
                          ? reminderData.reminderDateTime.toISOString()
                          : reminderData.reminderDateTime, // Pass through if already string
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create reminder' }));
    console.error("Create reminder error response:", errorData);
    throw new Error(errorData.message || 'Failed to create reminder');
  }
   const data = await response.json();
   // Convert returned date strings to Date objects
    return {
       ...data,
       reminderDateTime: new Date(data.reminderDateTime),
       createdAt: new Date(data.createdAt)
   };
}

/**
 * Updates an existing reminder using PUT. Sends Date as ISO string if included.
 * Assumes the API returns the updated reminder with dates as ISO strings.
 */
export async function updateReminder(id: string, reminderData: ReminderUpdateData): Promise<Reminder> {
  const payload: any = { ...reminderData };
   // Convert Date object to ISO string before sending, if present
   if (payload.reminderDateTime && payload.reminderDateTime instanceof Date) {
       payload.reminderDateTime = payload.reminderDateTime.toISOString();
   }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to update reminder ${id}` }));
    console.error("Update reminder error response:", errorData);
    throw new Error(errorData.message || `Failed to update reminder ${id}`);
  }
  const data = await response.json();
  // Convert returned date strings to Date objects
   return {
       ...data,
       reminderDateTime: new Date(data.reminderDateTime),
       createdAt: new Date(data.createdAt)
   };
}

/**
 * Toggles the completion status of a reminder using PATCH.
 * Assumes the API returns the updated reminder with dates as ISO strings.
 */
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
     // Convert returned date strings to Date objects
     return {
         ...data,
         reminderDateTime: new Date(data.reminderDateTime),
         createdAt: new Date(data.createdAt)
     };
}


/**
 * Deletes a reminder by ID.
 */
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
