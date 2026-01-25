import Redis from 'ioredis';
import { redisHealthTracker } from '../utils/redisHealth.js';
import { logger } from '../utils/logger.js';

/**
 * Redis Client Setup
 * 
 * Purpose: Singleton Redis client for caching, concurrency control, and performance optimization
 * 
 * IMPORTANT:
 * - Redis is OPTIONAL - system must work if Redis is down
 * - PostgreSQL is the single source of truth
 * - Redis failures should log errors but NOT crash the server
 * - Health tracking enabled for observability
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
      logger.info('Redis client connected', { event: 'redis_connect' });
      redisAvailable = true;
      redisHealthTracker.markHealthy();
    });

    client.on('ready', () => {
      logger.info('Redis client ready', { event: 'redis_ready' });
      redisAvailable = true;
      redisHealthTracker.markHealthy();
    });

    client.on('error', (err) => {
      logger.error('Redis connection error', { 
        event: 'redis_error', 
        error: err.message 
      });
      redisAvailable = false;
      redisHealthTracker.markUnhealthy(err.message);
      // DO NOT throw - system must work without Redis
    });

    client.on('close', () => {
      logger.warn('Redis connection closed', { event: 'redis_close' });
      redisAvailable = false;
      redisHealthTracker.markUnhealthy('Connection closed');
    });

    client.on('reconnecting', () => {
      logger.info('Redis reconnecting', { event: 'redis_reconnecting' });
      redisAvailable = false;
    });

    // Attempt to connect
    client.connect().catch((err) => {
      logger.error('Failed to connect to Redis', { 
        event: 'redis_connect_failed', 
        error: err.message 
      });
      logger.mode('degraded', 'Redis connection failed');
      redisAvailable = false;
      redisHealthTracker.markUnhealthy(err.message);
    });

    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error initializing Redis client', { 
      event: 'redis_init_failed', 
      error: errorMessage 
    });
    logger.mode('degraded', 'Redis initialization failed');
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
      logger.info('Redis connection closed gracefully', { event: 'redis_shutdown' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error closing Redis connection', { 
        event: 'redis_shutdown_failed', 
        error: errorMessage 
      });
    } finally {
      redisClient = null;
      redisAvailable = false;
    }
  }
};

/**
 * Get Redis health status
 */
export const getRedisHealth = () => {
  return redisHealthTracker.getStatus();
};
