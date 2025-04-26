import type { ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type jwt from 'jsonwebtoken';


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
  userId: string; // ID of the user who owns this client
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
  userId: string; // ID of the user who owns this quotation
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
  userId: string; // ID of the user who owns this reminder
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
 * Represents a user profile that can be safely returned by the API.
 */
export type UserProfile = Omit<User, 'passwordHash'>;


/**
 * Payload structure for JWT tokens.
 */
export interface JwtPayload extends jwt.JwtPayload { // Extend base JwtPayload
  userId: string; // User's MongoDB _id as string
  username: string;
  role: User['role'];
}

/**
 * Utility type for MongoDB documents before ID mapping
 */
export type MongoDoc<T> = Omit<T, 'id'> & { _id: ObjectId };


/**
 * Represents the structure containing user info extracted from JWT in middleware/API routes.
 */
export interface AuthenticatedUser {
    userId: string;
    username: string;
    role: User['role'];
}

/**
 * Helper function type for checking user role and authentication status.
 */
export type RoleCheck = (requiredRole?: User['role']) => Promise<{
    isAuthenticated: boolean;
    isAuthorized: boolean;
    user: AuthenticatedUser | null;
    error?: string;
    status?: number;
}>;

/**
 * Type for the result of connectToDatabase.
 */
export interface DatabaseConnection {
    client: MongoClient;
    db: Db;
    collections: ReturnType<typeof getCollections>; // Use return type of getCollections
}

// Re-declare getCollections type here as it's defined in mongodb.ts
// This avoids circular dependency if we were to import it directly
// Ensure this matches the actual return type in mongodb.ts
type CollectionMap = {
    users: Collection<Omit<User, 'id'>>;
    clients: Collection<Omit<Client, 'id'>>;
    quotations: Collection<Omit<Quotation, 'id'>>;
    reminders: Collection<Omit<Reminder, 'id'>>;
}
export interface DatabaseConnection {
    client: MongoClient;
    db: Db;
    collections: CollectionMap;
}
