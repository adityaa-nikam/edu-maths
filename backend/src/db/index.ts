import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const getConnectionString = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }
  return url;
};

// Lazy initialization
let clientInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (!dbInstance) {
    const connectionString = getConnectionString();
    // Configure connection pool with proper limits
    clientInstance = postgres(connectionString, {
      max: 10, // Maximum 10 connections per instance
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 30, // Increased connection timeout for Render/Supabase
      max_lifetime: 60 * 30, // 30 minutes max connection lifetime
    });
    dbInstance = drizzle(clientInstance);
  }
  return dbInstance;
};

// Test database connection
export const testConnection = async () => {
  try {
    if (!clientInstance) {
      const connectionString = getConnectionString();
      clientInstance = postgres(connectionString);
    }
    await clientInstance`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Export db instance (lazy loaded)
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    const instance = getDb();
    return (instance as any)[prop];
  }
});
