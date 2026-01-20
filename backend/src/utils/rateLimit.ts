/**
 * Rate Limiting Utility
 * 
 * Provides Redis-backed rate limiting for student API routes.
 * Fully configurable via environment variables and fails safely (fail open).
 * 
 * FEATURES:
 * - Per-student, per-exam rate limiting
 * - Environment variable configuration
 * - Graceful degradation when Redis is unavailable
 * - Atomic increment operations
 * - Automatic key expiry
 */

import { getRedisClient, isRedisAvailable } from '../db/redis.js';

interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt?: Date;
}

// Read from environment variables with fallbacks
const RATE_LIMITS = {
    answer: { 
        limit: parseInt(process.env.RATE_LIMIT_ANSWER_PER_SEC || '10'), 
        windowSeconds: 1 
    },
    submit: { 
        limit: parseInt(process.env.RATE_LIMIT_SUBMIT_PER_MIN || '3'), 
        windowSeconds: 60 
    },
};

// Check if rate limiting is globally enabled
const isRateLimitEnabled = process.env.RATE_LIMIT_ENABLED === 'true';

console.log('🔧 Rate Limit Config:', {
    enabled: isRateLimitEnabled,
    answer: RATE_LIMITS.answer,
    submit: RATE_LIMITS.submit,
});

export async function checkRateLimit(
    action: 'answer' | 'submit',
    examId: string,
    studentId: string
): Promise<RateLimitResult> {
    // If rate limiting is disabled globally
    if (!isRateLimitEnabled) {
        console.log('⚠️ Rate limiting is disabled (RATE_LIMIT_ENABLED=false)');
        return { allowed: true, limit: RATE_LIMITS[action].limit, remaining: RATE_LIMITS[action].limit };
    }

    const redis = getRedisClient();
    
    // If Redis unavailable, allow request (fail open)
    if (!redis || !isRedisAvailable()) {
        console.log('⚠️ Rate limit bypassed - Redis unavailable');
        return { allowed: true, limit: RATE_LIMITS[action].limit, remaining: RATE_LIMITS[action].limit };
    }

    const key = `ratelimit:${action}:${examId}:${studentId}`;
    const config = RATE_LIMITS[action];

    try {
        // Increment counter
        const count = await redis.incr(key);
        console.log(`🔢 Rate limit check: ${key} = ${count}/${config.limit}`);

        // Set expiry on first request
        if (count === 1) {
            await redis.expire(key, config.windowSeconds);
            console.log(`⏰ Set expiry: ${config.windowSeconds}s for ${key}`);
        }

        // Get TTL for reset time
        const ttl = await redis.ttl(key);
        const resetAt = new Date(Date.now() + ttl * 1000);

        if (count > config.limit) {
            console.log(`🚫 Rate limit exceeded: ${count}/${config.limit}`);
            return {
                allowed: false,
                limit: config.limit,
                remaining: 0,
                resetAt,
            };
        }

        console.log(`✅ Rate limit OK: ${count}/${config.limit}, remaining: ${config.limit - count}`);
        return {
            allowed: true,
            limit: config.limit,
            remaining: config.limit - count,
            resetAt,
        };
    } catch (error) {
        console.error('❌ Rate limit check error:', error);
        // Fail open on error
        return { allowed: true, limit: config.limit, remaining: config.limit };
    }
}

export function getRateLimitErrorMessage(action: 'answer' | 'submit', resetAt?: Date): string {
    const actionText = action === 'answer' ? 'submit answers' : 'submit exam';
    const resetTime = resetAt ? ` Try again after ${resetAt.toISOString()}` : '';
    return `Too many requests. You can only ${actionText} ${RATE_LIMITS[action].limit} times per minute.${resetTime}`;
}
