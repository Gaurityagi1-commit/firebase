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
  phone: string;
  requirements: string;
  priority: Priority;
  createdAt: Date;
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
  createdAt: Date;
}

/**
 * Represents the details needed for a reminder.
 * Uses optional phoneNumber as it might not always be required/available.
 */
export interface Reminder {
  id: string;
  clientId: string;
  clientName: string; // Denormalized
  reminderDateTime: Date;
  message: string;
  type: 'email' | 'whatsapp' | 'meeting' | 'follow-up'; // Added type for clarity
  completed: boolean;
  createdAt: Date;
}
