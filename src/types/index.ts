import type { ObjectId } from 'mongodb';

/**
 * Represents the priority timeline for clients.
 */
export type Priority = '1 month' | '2 months' | '3 months' | 'none';

/**
 * Represents a client in the CRM (as returned by the API).
 * Corresponds to the MongoDB 'clients' collection schema.
 */
export interface Client {
  id: string; // MongoDB _id converted to string
  name: string;
  email: string;
  phone: string;
  requirements: string;
  priority: Priority;
  createdAt: Date;
}

/**
 * Represents a quotation (as returned by the API).
 * Corresponds to the MongoDB 'quotations' collection schema.
 */
export interface Quotation {
  id: string; // MongoDB _id converted to string
  clientId: string; // Foreign key to Client (as string ObjectId)
  clientName: string; // Denormalized for display convenience
  details: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: Date;
}

/**
 * Represents a reminder (as returned by the API).
 * Corresponds to the MongoDB 'reminders' collection schema.
 */
export interface Reminder {
  id: string; // MongoDB _id converted to string
  clientId: string; // Foreign key to Client (as string ObjectId)
  clientName: string; // Denormalized
  reminderDateTime: Date;
  message: string;
  type: 'email' | 'whatsapp' | 'meeting' | 'follow-up';
  completed: boolean;
  createdAt: Date;
}

/**
 * Represents a user in the system (as returned by the API, without password hash).
 * Corresponds to the MongoDB 'users' collection schema (minus passwordHash).
 */
export interface User {
  id: string; // MongoDB _id converted to string
  username: string;
  email: string;
  passwordHash: string; // This should ideally not be exposed via API, only used internally
  role: 'admin' | 'user';
  createdAt: Date;
}

/**
 * Payload structure for JWT tokens.
 */
export interface JwtPayload {
  userId: string; // User's MongoDB _id as string
  username: string;
  role: User['role'];
}

// Utility type for MongoDB documents before ID mapping
export type MongoDoc<T> = Omit<T, 'id'> & { _id: ObjectId };
