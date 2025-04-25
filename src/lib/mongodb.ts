// src/lib/mongodb.ts
import { MongoClient, Db, Collection } from 'mongodb';
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

/**
 * Connects to the MongoDB database and returns the Db instance and collections.
 * Caches the connection for efficiency.
 */
export async function connectToDatabase() {
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
function getCollections(database: Db) {
  return {
    users: database.collection<Omit<User, 'id'>>('users'), // Store without virtual 'id'
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
    // Users: Ensure unique username and email
    await database.collection('users').createIndex({ username: 1 }, { unique: true });
    await database.collection('users').createIndex({ email: 1 }, { unique: true });

    // Clients: Index name and priority for faster filtering/sorting
    await database.collection('clients').createIndex({ name: 1 });
    await database.collection('clients').createIndex({ priority: 1 });
    await database.collection('clients').createIndex({ createdAt: -1 }); // For recent clients

    // Quotations: Index clientId, status, and createdAt
    await database.collection('quotations').createIndex({ clientId: 1 });
    await database.collection('quotations').createIndex({ status: 1 });
    await database.collection('quotations').createIndex({ createdAt: -1 }); // For recent quotations

    // Reminders: Index clientId, reminderDateTime, and completed status
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
export function mapMongoId<T extends { _id: any }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() };
}
