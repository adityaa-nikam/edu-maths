/**
 * Exam Attempt Helper Functions
 * 
 * Utilities for checking exam attempt state with Redis caching
 */

import { db } from '../db/index.js';
import { exams, examAttempts } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getRedisClient, isRedisAvailable } from '../db/redis.js';
import { getExamAttemptActiveKey } from './redisKeys.js';

/**
 * Check if an exam attempt is still active
 * 
 * Fast path: Check Redis key existence (O(1))
 * Slow path: Query PostgreSQL and calculate (fallback)
 * 
 * An attempt is active if:
 * 1. It hasn't been submitted yet
 * 2. Current time is before the global exam end time
 * 
 * @param attemptId - Exam attempt UUID
 * @returns Promise<boolean> - true if active, false if expired/submitted
 */
export async function isExamAttemptActive(attemptId: string): Promise<boolean> {
    const redis = getRedisClient();
    const activeKey = getExamAttemptActiveKey(attemptId);

    // Fast path: Check Redis first (if available)
    if (redis && isRedisAvailable()) {
        try {
            const exists = await redis.exists(activeKey);
            if (exists === 1) {
                // Key exists = attempt is active
                return true;
            } else {
                // Key doesn't exist = attempt is over
                // Note: Could be expired OR never set (Redis was down during start)
                // Fall through to DB check to be certain
            }
        } catch (redisError) {
            console.error('Redis error (attempt active check):', redisError);
            // Fall through to DB check
        }
    }

    // Slow path: Query PostgreSQL and calculate
    try {
        // Fetch attempt and exam in a single query
        const result = await db
            .select({
                submittedAt: examAttempts.submittedAt,
                examEndTime: exams.endTime,
            })
            .from(examAttempts)
            .innerJoin(exams, eq(examAttempts.examId, exams.id))
            .where(eq(examAttempts.id, attemptId))
            .limit(1);

        if (result.length === 0) {
            // Attempt doesn't exist
            return false;
        }

        const { submittedAt, examEndTime } = result[0];

        // Already submitted = not active
        if (submittedAt) {
            return false;
        }

        // Check if current time is before exam end time
        const now = new Date();
        const endTime = new Date(examEndTime);
        
        return now < endTime;

    } catch (dbError) {
        console.error('Database error (attempt active check):', dbError);
        // Conservative: assume not active on error
        return false;
    }
}

/**
 * Set an exam attempt as active in Redis
 * 
 * Called when exam attempt is created
 * TTL is calculated to expire exactly at global exam end time
 * 
 * @param attemptId - Exam attempt UUID
 * @param examEndTime - Global exam end time (Date)
 */
export async function setExamAttemptActive(attemptId: string, examEndTime: Date): Promise<void> {
    const redis = getRedisClient();
    
    if (!redis || !isRedisAvailable()) {
        // Redis not available, skip (DB remains source of truth)
        return;
    }

    try {
        const activeKey = getExamAttemptActiveKey(attemptId);
        const now = new Date();
        const ttlSeconds = Math.floor((examEndTime.getTime() - now.getTime()) / 1000);

        if (ttlSeconds <= 0) {
            // Exam already ended (edge case: student started at last moment)
            console.warn(`⚠️ Exam already ended, not setting active key: ${activeKey}`);
            return;
        }

        // Set key with TTL to expire at exam end time
        await redis.setex(activeKey, ttlSeconds, '1');
        console.log(`✅ Attempt active: ${activeKey} (TTL: ${ttlSeconds}s, expires at ${examEndTime.toISOString()})`);

    } catch (redisError) {
        console.error('Redis error (set attempt active):', redisError);
        // Non-critical: DB remains source of truth
    }
}

/**
 * Mark an exam attempt as inactive in Redis
 * 
 * Called when exam is submitted before time expires
 * Removes the active key immediately
 * 
 * @param attemptId - Exam attempt UUID
 */
export async function markExamAttemptInactive(attemptId: string): Promise<void> {
    const redis = getRedisClient();
    
    if (!redis || !isRedisAvailable()) {
        // Redis not available, skip
        return;
    }

    try {
        const activeKey = getExamAttemptActiveKey(attemptId);
        await redis.del(activeKey);
        console.log(`🗑️ Attempt inactive: ${activeKey}`);

    } catch (redisError) {
        console.error('Redis error (mark attempt inactive):', redisError);
        // Non-critical: key will expire naturally
    }
}
