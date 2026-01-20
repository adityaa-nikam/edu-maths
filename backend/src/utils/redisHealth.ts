/**
 * Redis Health Tracker
 * 
 * Maintains in-memory Redis health state for observability and degraded mode detection.
 * 
 * PURPOSE:
 * - Track Redis connection status
 * - Signal degraded mode when Redis unavailable
 * - Provide visibility into Redis operational state
 * - Enable operators to distinguish infra issues from logic bugs
 * 
 * BEHAVIOR:
 * - Starts in "unknown" state
 * - Updates to "healthy" on successful operations
 * - Updates to "unhealthy" on failures
 * - Tracks last status change time
 * - Records failure reasons
 */

export interface RedisHealthStatus {
    status: 'healthy' | 'unhealthy' | 'unknown';
    mode: 'normal' | 'degraded';
    lastChecked: Date;
    lastStatusChange: Date;
    consecutiveFailures: number;
    lastError?: string;
    uptime?: number; // milliseconds since last became healthy
}

class RedisHealthTracker {
    private status: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
    private lastChecked: Date = new Date();
    private lastStatusChange: Date = new Date();
    private consecutiveFailures: number = 0;
    private lastError?: string;
    private lastHealthyTime?: Date;

    /**
     * Mark Redis as healthy (successful operation)
     */
    markHealthy(): void {
        const wasUnhealthy = this.status === 'unhealthy';
        
        if (wasUnhealthy) {
            console.log('✅ Redis recovered - entering normal mode', {
                event: 'redis_recovered',
                previousFailures: this.consecutiveFailures,
                downtimeDuration: this.lastHealthyTime 
                    ? Date.now() - this.lastHealthyTime.getTime() 
                    : 'unknown'
            });
            this.lastStatusChange = new Date();
        }

        this.status = 'healthy';
        this.lastChecked = new Date();
        this.lastHealthyTime = new Date();
        this.consecutiveFailures = 0;
        this.lastError = undefined;
    }

    /**
     * Mark Redis as unhealthy (operation failed)
     */
    markUnhealthy(error: string): void {
        const wasHealthy = this.status === 'healthy';
        
        this.consecutiveFailures++;
        this.lastError = error;
        this.lastChecked = new Date();

        if (wasHealthy) {
            console.error('❌ Redis failure detected - entering degraded mode', {
                event: 'redis_failure',
                error: error,
                timestamp: new Date().toISOString()
            });
            this.status = 'unhealthy';
            this.lastStatusChange = new Date();
        } else if (this.consecutiveFailures === 1) {
            // First failure from unknown state
            console.error('❌ Redis unavailable - system in degraded mode', {
                event: 'redis_unavailable',
                error: error,
                timestamp: new Date().toISOString()
            });
            this.status = 'unhealthy';
            this.lastStatusChange = new Date();
        }

        // Log periodic reminders for prolonged degradation
        if (this.consecutiveFailures % 10 === 0) {
            console.warn('⚠️ Redis still degraded', {
                event: 'redis_degraded_reminder',
                consecutiveFailures: this.consecutiveFailures,
                lastError: error,
                degradedSince: this.lastStatusChange.toISOString()
            });
        }
    }

    /**
     * Get current health status
     */
    getStatus(): RedisHealthStatus {
        const mode = this.status === 'healthy' ? 'normal' : 'degraded';
        
        return {
            status: this.status,
            mode: mode,
            lastChecked: this.lastChecked,
            lastStatusChange: this.lastStatusChange,
            consecutiveFailures: this.consecutiveFailures,
            lastError: this.lastError,
            uptime: this.lastHealthyTime 
                ? Date.now() - this.lastHealthyTime.getTime() 
                : undefined
        };
    }

    /**
     * Check if system is in degraded mode
     */
    isDegraded(): boolean {
        return this.status !== 'healthy';
    }

    /**
     * Get human-readable status summary
     */
    getSummary(): string {
        const status = this.getStatus();
        if (status.status === 'healthy') {
            return `Redis: healthy (mode: normal)`;
        } else if (status.status === 'unhealthy') {
            return `Redis: unhealthy (mode: degraded, failures: ${status.consecutiveFailures})`;
        } else {
            return `Redis: unknown (initializing)`;
        }
    }
}

// Singleton instance
const redisHealthTracker = new RedisHealthTracker();

export { redisHealthTracker };
