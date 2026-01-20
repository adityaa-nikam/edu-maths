/**
 * Cache Utility
 * 
 * Centralized Redis caching layer with graceful fallback.
 * 
 * PURPOSE:
 * - Speed up read-heavy routes
 * - Reduce database load
 * - Provide consistent caching interface
 * - Gracefully degrade when Redis unavailable
 * 
 * PRINCIPLES:
 * - Cache is OPTIONAL (system works without it)
 * - All operations are non-blocking
 * - Failed cache operations never fail requests
 * - PostgreSQL is always source of truth
 * 
 * USAGE:
 * ```typescript
 * // Read with cache
 * const cached = await cache.get<ExamData>(cacheKey);
 * if (cached) return cached;
 * 
 * const data = await db.query(...);
 * await cache.set(cacheKey, data, 60); // 60 second TTL
 * return data;
 * 
 * // Invalidate on write
 * await db.insert(...);
 * await cache.del(cacheKey);
 * ```
 */

import { getRedisClient } from '../db/redis.js';
import { redisHealthTracker } from './redisHealth.js';
import { logger } from './logger.js';

class Cache {
    /**
     * Get value from cache
     * 
     * @param key - Cache key
     * @returns Parsed value or null if miss/error
     */
    async get<T>(key: string): Promise<T | null> {
        const redis = getRedisClient();
        
        if (!redis) {
            logger.debug('Cache GET bypassed - Redis unavailable', { 
                action: 'cache_get_bypass',
                key 
            });
            return null;
        }

        try {
            const value = await redis.get(key);
            
            if (value === null) {
                logger.debug('Cache MISS', { 
                    action: 'cache_miss',
                    key 
                });
                return null;
            }

            const parsed = JSON.parse(value) as T;
            
            logger.debug('Cache HIT', { 
                action: 'cache_hit',
                key 
            });
            
            // Mark Redis as healthy on successful operation
            redisHealthTracker.markHealthy();
            
            return parsed;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            logger.error('Cache GET failed', { 
                action: 'cache_get_error',
                key,
                error: errorMessage
            });
            
            redisHealthTracker.markUnhealthy(errorMessage);
            
            // Return null on error - treat as cache miss
            return null;
        }
    }

    /**
     * Set value in cache with TTL
     * 
     * @param key - Cache key
     * @param value - Value to cache (will be JSON stringified)
     * @param ttlSeconds - Time to live in seconds
     */
    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        const redis = getRedisClient();
        
        if (!redis) {
            logger.debug('Cache SET bypassed - Redis unavailable', { 
                action: 'cache_set_bypass',
                key,
                ttl: ttlSeconds
            });
            return;
        }

        try {
            const serialized = JSON.stringify(value);
            await redis.setex(key, ttlSeconds, serialized);
            
            logger.debug('Cache SET success', { 
                action: 'cache_set',
                key,
                ttl: ttlSeconds,
                size: serialized.length
            });
            
            // Mark Redis as healthy on successful operation
            redisHealthTracker.markHealthy();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            logger.error('Cache SET failed', { 
                action: 'cache_set_error',
                key,
                error: errorMessage
            });
            
            redisHealthTracker.markUnhealthy(errorMessage);
            
            // Fail silently - don't throw
        }
    }

    /**
     * Delete single key from cache
     * 
     * @param key - Cache key to delete
     */
    async del(key: string): Promise<void> {
        const redis = getRedisClient();
        
        if (!redis) {
            logger.debug('Cache DEL bypassed - Redis unavailable', { 
                action: 'cache_del_bypass',
                key
            });
            return;
        }

        try {
            await redis.del(key);
            
            logger.debug('Cache DEL success', { 
                action: 'cache_del',
                key
            });
            
            // Mark Redis as healthy on successful operation
            redisHealthTracker.markHealthy();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            logger.error('Cache DEL failed', { 
                action: 'cache_del_error',
                key,
                error: errorMessage
            });
            
            redisHealthTracker.markUnhealthy(errorMessage);
            
            // Fail silently - don't throw
        }
    }

    /**
     * Delete multiple keys by pattern
     * 
     * WARNING: Use sparingly - SCAN operation can be slow
     * 
     * @param pattern - Redis key pattern (e.g., "teacher:academy:*:exams")
     */
    async delPattern(pattern: string): Promise<void> {
        const redis = getRedisClient();
        
        if (!redis) {
            logger.debug('Cache DEL pattern bypassed - Redis unavailable', { 
                action: 'cache_del_pattern_bypass',
                pattern
            });
            return;
        }

        try {
            // Use SCAN instead of KEYS for production safety
            const keys: string[] = [];
            let cursor = '0';
            
            do {
                const [nextCursor, matchedKeys] = await redis.scan(
                    cursor,
                    'MATCH',
                    pattern,
                    'COUNT',
                    100
                );
                
                cursor = nextCursor;
                keys.push(...matchedKeys);
            } while (cursor !== '0');

            if (keys.length > 0) {
                await redis.del(...keys);
                
                logger.debug('Cache DEL pattern success', { 
                    action: 'cache_del_pattern',
                    pattern,
                    keysDeleted: keys.length
                });
            } else {
                logger.debug('Cache DEL pattern - no keys found', { 
                    action: 'cache_del_pattern_empty',
                    pattern
                });
            }
            
            // Mark Redis as healthy on successful operation
            redisHealthTracker.markHealthy();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            logger.error('Cache DEL pattern failed', { 
                action: 'cache_del_pattern_error',
                pattern,
                error: errorMessage
            });
            
            redisHealthTracker.markUnhealthy(errorMessage);
            
            // Fail silently - don't throw
        }
    }

    /**
     * Check if a key exists in cache
     * 
     * @param key - Cache key
     * @returns true if exists, false otherwise
     */
    async exists(key: string): Promise<boolean> {
        const redis = getRedisClient();
        
        if (!redis) {
            return false;
        }

        try {
            const result = await redis.exists(key);
            redisHealthTracker.markHealthy();
            return result === 1;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Cache EXISTS failed', { 
                action: 'cache_exists_error',
                key,
                error: errorMessage
            });
            redisHealthTracker.markUnhealthy(errorMessage);
            return false;
        }
    }

    /**
     * Get remaining TTL for a key
     * 
     * @param key - Cache key
     * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
     */
    async ttl(key: string): Promise<number> {
        const redis = getRedisClient();
        
        if (!redis) {
            return -2;
        }

        try {
            const ttl = await redis.ttl(key);
            redisHealthTracker.markHealthy();
            return ttl;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Cache TTL failed', { 
                action: 'cache_ttl_error',
                key,
                error: errorMessage
            });
            redisHealthTracker.markUnhealthy(errorMessage);
            return -2;
        }
    }
}

// Singleton instance
const cache = new Cache();

export { cache };
