/**
 * Cache Utility
 *
 * Centralized Redis caching layer with graceful fallback.
 *
 * GUARANTEES:
 * - Redis OPTIONAL hai
 * - Redis fail ho to DB se data jayega
 * - Redis error kabhi request fail nahi karega
 * - Network / timeout error swallow ho jayega
 */

import { getRedisClient, isRedisAvailable } from '../db/redis.js';
import { redisHealthTracker } from './redisHealth.js';
import { logger } from './logger.js';

class Cache {

    /**
     * Get value from cache
     * Falls back to DB on ANY Redis issue
     */
    async get<T>(key: string): Promise<T | null> {

        // 🔥 FIX #1: Redis availability gate
        if (!isRedisAvailable()) {
            logger.debug('Cache GET bypassed - Redis unavailable', {
                action: 'cache_get_bypass',
                key
            });
            return null;
        }

        const redis = getRedisClient();
        if (!redis) return null;

        try {
            // 🔥 FIX #2: Network / hang protection
            const value = await Promise.race([
                redis.get(key),
                new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Redis GET timeout')), 800)
                )
            ]);

            if (!value) {
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

            redisHealthTracker.markHealthy();
            return parsed;

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';

            logger.error('Cache GET failed - falling back to DB', {
                action: 'cache_get_error',
                key,
                error: message
            });

            redisHealthTracker.markUnhealthy(message);

            // 🔥 MOST IMPORTANT LINE
            return null;
        }
    }

    /**
     * Set value in cache
     * Silent failure if Redis is down
     */
    async set(key: string, value: any, ttlSeconds: number): Promise<void> {

        if (!isRedisAvailable()) return;

        const redis = getRedisClient();
        if (!redis) return;

        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));

            logger.debug('Cache SET success', {
                action: 'cache_set',
                key,
                ttl: ttlSeconds
            });

            redisHealthTracker.markHealthy();

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';

            logger.warn('Cache SET failed (ignored)', {
                action: 'cache_set_error',
                key,
                error: message
            });

            redisHealthTracker.markUnhealthy(message);
        }
    }

    /**
     * Delete single key
     */
    async del(key: string): Promise<void> {

        if (!isRedisAvailable()) return;

        const redis = getRedisClient();
        if (!redis) return;

        try {
            await redis.del(key);
            redisHealthTracker.markHealthy();
        } catch (error) {
            redisHealthTracker.markUnhealthy(
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Delete keys by pattern (safe)
     */
    async delPattern(pattern: string): Promise<void> {

        if (!isRedisAvailable()) return;

        const redis = getRedisClient();
        if (!redis) return;

        try {
            let cursor = '0';
            const keys: string[] = [];

            do {
                const [nextCursor, matched] = await redis.scan(
                    cursor,
                    'MATCH',
                    pattern,
                    'COUNT',
                    100
                );
                cursor = nextCursor;
                keys.push(...matched);
            } while (cursor !== '0');

            if (keys.length) {
                await redis.del(...keys);
            }

            redisHealthTracker.markHealthy();

        } catch (error) {
            redisHealthTracker.markUnhealthy(
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Check key exists
     */
    async exists(key: string): Promise<boolean> {

        if (!isRedisAvailable()) return false;

        const redis = getRedisClient();
        if (!redis) return false;

        try {
            const result = await redis.exists(key);
            redisHealthTracker.markHealthy();
            return result === 1;
        } catch {
            return false;
        }
    }

    /**
     * TTL of key
     */
    async ttl(key: string): Promise<number> {

        if (!isRedisAvailable()) return -2;

        const redis = getRedisClient();
        if (!redis) return -2;

        try {
            const ttl = await redis.ttl(key);
            redisHealthTracker.markHealthy();
            return ttl;
        } catch {
            return -2;
        }
    }
}

// ✅ Singleton export
export const cache = new Cache();
