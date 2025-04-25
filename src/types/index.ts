/**
 * Represents the priority timeline for clients.
 */
export type Priority = '1 month' | '2 months' | '3 months' | 'none';

/**
 * Represents a client in the CRM.
 */
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string; // Assuming phone is always present based on schema
  requirements: string;
  priority: Priority;
  createdAt: Date; // Use Date object
}

/**
 * Represents a quotation associated with a client.
 */
export interface Quotation {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for easier display
  details: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: Date; // Use Date object
}

/**
 * Represents the data structure for a reminder.
 */
export interface Reminder {
  id: string;
  clientId: string;
  clientName: string; // Denormalized
  reminderDateTime: Date; // Use Date object
  message: string;
  type: 'email' | 'whatsapp' | 'meeting' | 'follow-up';
  completed: boolean;
  createdAt: Date; // Use Date object
}
