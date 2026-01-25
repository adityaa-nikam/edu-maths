/**
 * Idempotency Utility
 * 
 * Provides Redis-backed idempotency for exam submission.
 * Ensures duplicate submit requests return the same result without reprocessing.
 * 
 * FEATURES:
 * - Request-level deduplication
 * - Cached response for duplicate requests
 * - Graceful degradation when Redis unavailable
 * - Short-lived idempotency markers (10 min TTL)
 */

import { getRedisClient } from '../db/redis.js';
import { getSubmitIdempotencyKey } from './redisKeys.js';

/**
 * Submit response structure stored in Redis
 */
export interface SubmitResponse {
    message: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    submittedAt: Date;
    autoSubmitted: boolean;
}

/**
 * Check if a submit request has already been processed
 * 
 * BEHAVIOR:
 * - Returns cached result if idempotency key exists
 * - Returns null if this is a new submission
 * - Returns null if Redis is unavailable (fail open)
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Cached submit response or null if not found
 */
export async function checkSubmitIdempotency(
    examId: string,
    studentId: string
): Promise<SubmitResponse | null> {
    const redis = getRedisClient();

    // If Redis unavailable, allow submission to proceed
    if (!redis) {
        console.log(`⚠️ Idempotency check bypassed (Redis unavailable) - submit for student ${studentId} on exam ${examId}`);
        return null;
    }

    try {
        const key = getSubmitIdempotencyKey(examId, studentId);
        const cachedResult = await redis.get(key);

        if (cachedResult) {
            console.log(`🔁 Idempotent submit detected - returning cached result for student ${studentId} on exam ${examId}`);
            const result = JSON.parse(cachedResult);
            // Convert submittedAt back to Date object
            result.submittedAt = new Date(result.submittedAt);
            return result;
        }

        // No cached result found - this is a new submission
        return null;

    } catch (error) {
        console.error(`⚠️ Idempotency check error (failing open):`, error);
        return null; // Fail open - allow submission
    }
}

/**
 * Store submit response in Redis for idempotency
 * 
 * BEHAVIOR:
 * - Stores response with 10-minute TTL
 * - Used to detect duplicate submit requests
 * - Fails silently if Redis unavailable
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @param response - Submit response to cache
 */
export async function storeSubmitIdempotency(
    examId: string,
    studentId: string,
    response: SubmitResponse
): Promise<void> {
    const redis = getRedisClient();

    // If Redis unavailable, skip storage (not critical)
    if (!redis) {
        console.log(`⚠️ Idempotency storage skipped (Redis unavailable) - submit for student ${studentId} on exam ${examId}`);
        return;
    }

    try {
        const key = getSubmitIdempotencyKey(examId, studentId);
        const ttlSeconds = 600; // 10 minutes

        // Store response as JSON with TTL
        await redis.setex(key, ttlSeconds, JSON.stringify(response));

        console.log(`💾 Idempotency stored - submit result cached for student ${studentId} on exam ${examId} (TTL: ${ttlSeconds}s)`);

    } catch (error) {
        // Non-critical error - submission already succeeded
        console.error(`⚠️ Idempotency storage error (non-critical):`, error);
    }
}
