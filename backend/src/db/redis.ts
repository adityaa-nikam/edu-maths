import Redis from 'ioredis';

/**
 * Redis Client Setup
 * 
 * Purpose: Singleton Redis client for caching, concurrency control, and performance optimization
 * 
 * IMPORTANT:
 * - Redis is OPTIONAL - system must work if Redis is down
 * - PostgreSQL is the single source of truth
 * - Redis failures should log errors but NOT crash the server
 */

let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Get Redis connection URL from environment
 */
const getRedisUrl = (): string | undefined => {
  return process.env.REDIS_URL;
};

/**
 * Initialize Redis client with graceful error handling
 */
const initializeRedis = (): Redis | null => {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    console.log('ℹ️ REDIS_URL not configured - Redis features disabled');
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true, // Don't connect immediately
    });

    // Connection event handlers
    client.on('connect', () => {
      console.log('✅ Redis client connected');
      redisAvailable = true;
    });

    client.on('ready', () => {
      console.log('✅ Redis client ready');
      redisAvailable = true;
    });

    client.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      redisAvailable = false;
      // DO NOT throw - system must work without Redis
    });

    client.on('close', () => {
      console.log('⚠️ Redis connection closed');
      redisAvailable = false;
    });

    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
      redisAvailable = false;
    });

    // Attempt to connect
    client.connect().catch((err) => {
      console.error('❌ Failed to connect to Redis:', err.message);
      console.log('⚠️ System will continue without Redis');
      redisAvailable = false;
    });

    return client;
  } catch (error) {
    console.error('❌ Error initializing Redis client:', error);
    console.log('⚠️ System will continue without Redis');
    return null;
  }
};

/**
 * Get singleton Redis client instance
 * Returns null if Redis is not available
 */
export const getRedisClient = (): Redis | null => {
  if (!redisClient) {
    redisClient = initializeRedis();
  }
  return redisClient;
};

/**
 * Check if Redis is currently available
 */
export const isRedisAvailable = (): boolean => {
  return redisAvailable && redisClient !== null;
};

/**
 * Gracefully close Redis connection
 * Used during server shutdown
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error);
    } finally {
      redisClient = null;
      redisAvailable = false;
    }
  }
};
