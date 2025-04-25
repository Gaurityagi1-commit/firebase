import { createClient } from '@vercel/kv';

if (!process.env.KV_URL || !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('Missing Vercel KV environment variables. Please check your .env file.');
  // You might want to throw an error here in a real application during startup
  // throw new Error('Missing Vercel KV environment variables.');
}

export const kv = createClient({
  url: process.env.KV_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
