/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and observability.
 * 
 * PURPOSE:
 * - Enable operators to check system status
 * - Expose Redis health and degraded mode
 * - Support load balancers and monitoring tools
 * - Provide quick status overview
 * 
 * RESPONSE FORMAT:
 * {
 *   status: "healthy" | "degraded",
 *   timestamp: ISO8601,
 *   services: {
 *     backend: { status: "healthy" },
 *     database: { status: "healthy" },
 *     redis: { status: "healthy" | "unhealthy" | "unknown", mode: "normal" | "degraded" }
 *   },
 *   uptime: milliseconds
 * }
 */

import { Router, Request, Response } from 'express';
import { getRedisHealth } from '../db/redis.js';
import { db } from '../db/index.js';

const router = Router();

// Track server start time
const serverStartTime = Date.now();

/**
 * GET /api/health
 * Returns system health status
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        // Check database connectivity
        let databaseStatus: 'healthy' | 'unhealthy' = 'healthy';
        try {
            // Simple query to verify DB connection
            await db.execute('SELECT 1');
        } catch (error) {
            databaseStatus = 'unhealthy';
        }

        // Get Redis health status
        const redisHealth = getRedisHealth();

        // Determine overall system status
        const overallStatus = 
            databaseStatus === 'unhealthy' ? 'critical' :
            redisHealth.status === 'unhealthy' ? 'degraded' :
            'healthy';

        // Build response
        const healthResponse = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - serverStartTime,
            services: {
                backend: {
                    status: 'healthy'
                },
                database: {
                    status: databaseStatus
                },
                redis: {
                    status: redisHealth.status,
                    mode: redisHealth.mode,
                    lastChecked: redisHealth.lastChecked.toISOString(),
                    consecutiveFailures: redisHealth.consecutiveFailures,
                    ...(redisHealth.lastError && { lastError: redisHealth.lastError })
                }
            }
        };

        // Set appropriate HTTP status code
        const httpStatus = 
            overallStatus === 'critical' ? 503 :
            overallStatus === 'degraded' ? 200 :
            200;

        res.status(httpStatus).json(healthResponse);

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Health check failed'
        });
    }
});

/**
 * GET /api/health/redis
 * Returns detailed Redis health status
 */
router.get('/redis', (req: Request, res: Response) => {
    try {
        const redisHealth = getRedisHealth();
        
        res.status(200).json({
            status: redisHealth.status,
            mode: redisHealth.mode,
            lastChecked: redisHealth.lastChecked.toISOString(),
            lastStatusChange: redisHealth.lastStatusChange.toISOString(),
            consecutiveFailures: redisHealth.consecutiveFailures,
            uptime: redisHealth.uptime,
            ...(redisHealth.lastError && { lastError: redisHealth.lastError })
        });
    } catch (error) {
        console.error('Redis health check error:', error);
        res.status(500).json({
            error: 'Failed to retrieve Redis health status'
        });
    }
});

export default router;
