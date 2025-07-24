import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with optimized settings for Neon
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3,
  min: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000,
  allowExitOnIdle: false,
});

// Handle pool errors and reconnection
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't exit on database errors, let the pool handle reconnection
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

export const db = drizzle({ client: pool, schema });

// Test connection and warm up pool
async function warmUpPool() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database pool warmed up');
  } catch (error) {
    console.warn('Database warm-up failed:', error.message);
  }
}

// Warm up on startup
warmUpPool();