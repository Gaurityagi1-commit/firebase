// src/lib/mongodb.ts
import { MongoClient, Db, Collection, ObjectId } from 'mongodb'; // Import ObjectId
import type { User, Client, Quotation, Reminder } from '@/types';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'salesflow-crm'; // Default DB name if not set

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let client: MongoClient;
let db: Db;

// Use a global variable to maintain a cached connection across hot reloads in development.
// This prevents connections growing exponentially during API Route usage.
// In production, this ensures a single connection pool is used.
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Type for the collections map returned by getCollections
export type AppCollections = {
  users: Collection<Omit<User, 'id'>>;
  clients: Collection<Omit<Client, 'id'>>;
  quotations: Collection<Omit<Quotation, 'id'>>;
  reminders: Collection<Omit<Reminder, 'id'>>;
};

/**
 * Connects to the MongoDB database and returns the Db instance and collections.
 * Caches the connection for efficiency.
 */
export async function connectToDatabase(): Promise<{ client: MongoClient, db: Db, collections: AppCollections }> {
  if (cachedClient && cachedDb) {
    // console.log("Using cached MongoDB connection");
    return { client: cachedClient, db: cachedDb, collections: getCollections(cachedDb) };
  }

  try {
    // console.log("Creating new MongoDB connection");
    client = new MongoClient(MONGODB_URI!); // Non-null assertion as we checked above
    await client.connect();
    db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    // Optional: Add indexes for performance (e.g., on frequently queried fields)
    await setupIndexes(db);

    return { client, db, collections: getCollections(db) };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Could not connect to database.');
  }
}

/**
 * Returns typed collection instances.
 * @param database The Db instance.
 */
function getCollections(database: Db): AppCollections {
  return {
    users: database.collection<Omit<User, 'id'>>('users'),
    clients: database.collection<Omit<Client, 'id'>>('clients'),
    quotations: database.collection<Omit<Quotation, 'id'>>('quotations'),
    reminders: database.collection<Omit<Reminder, 'id'>>('reminders'),
  };
}

/**
 * Sets up necessary database indexes.
 * @param database The Db instance.
 */
async function setupIndexes(database: Db) {
  try {
    // Users: Ensure unique username and email, index role
    await database.collection('users').createIndex({ username: 1 }, { unique: true });
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    await database.collection('users').createIndex({ role: 1 });

    // Clients: Index userId, name, priority, and createdAt
    await database.collection('clients').createIndex({ userId: 1 });
    await database.collection('clients').createIndex({ name: 1 });
    await database.collection('clients').createIndex({ priority: 1 });
    await database.collection('clients').createIndex({ createdAt: -1 });

    // Quotations: Index userId, clientId, status, and createdAt
    await database.collection('quotations').createIndex({ userId: 1 });
    await database.collection('quotations').createIndex({ clientId: 1 });
    await database.collection('quotations').createIndex({ status: 1 });
    await database.collection('quotations').createIndex({ createdAt: -1 });

    // Reminders: Index userId, clientId, reminderDateTime, and completed status
    await database.collection('reminders').createIndex({ userId: 1 });
    await database.collection('reminders').createIndex({ clientId: 1 });
    await database.collection('reminders').createIndex({ reminderDateTime: 1 });
    await database.collection('reminders').createIndex({ completed: 1 });
    await database.collection('reminders').createIndex({ createdAt: -1 });

    // console.log("Database indexes ensured.");
  } catch (error) {
    console.error("Error ensuring database indexes:", error);
    // Don't throw, allow app to continue, but log the error
  }
}

// Helper function to map MongoDB _id to id and remove _id
// Generic function to handle different document types
export function mapMongoId<T extends { _id: ObjectId }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() };
}
