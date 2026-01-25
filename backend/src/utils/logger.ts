/**
 * Structured Logger
 * 
 * Provides consistent, structured logging throughout the application.
 * 
 * PURPOSE:
 * - Human-readable and machine-parseable logs
 * - Consistent log format across all modules
 * - Request correlation via requestId
 * - Context-aware logging (exam, student, route)
 * - No sensitive data leakage
 * 
 * FEATURES:
 * - Structured key-value logging
 * - Log levels (info, warn, error)
 * - Automatic timestamp
 * - Request correlation
 * - Safe serialization (no circular refs)
 */

export interface LogContext {
    requestId?: string;
    examId?: string;
    studentId?: string;
    attemptId?: string;
    route?: string;
    action?: string;
    [key: string]: any;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    /**
     * Format log message with context
     */
    private formatLog(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const levelEmoji = {
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            debug: '🔍'
        }[level];

        // Build context string
        const contextStr = context ? this.serializeContext(context) : '';
        
        return `${levelEmoji} [${timestamp}] ${message}${contextStr}`;
    }

    /**
     * Serialize context object safely
     */
    private serializeContext(context: LogContext): string {
        try {
            const filtered = this.filterSensitiveData(context);
            const parts: string[] = [];
            
            for (const [key, value] of Object.entries(filtered)) {
                if (value !== undefined && value !== null) {
                    parts.push(`${key}=${JSON.stringify(value)}`);
                }
            }
            
            return parts.length > 0 ? ` | ${parts.join(' ')}` : '';
        } catch (error) {
            return ' | [context serialization error]';
        }
    }

    /**
     * Filter out sensitive data from context
     */
    private filterSensitiveData(context: LogContext): LogContext {
        const filtered = { ...context };
        
        // Remove sensitive fields
        delete filtered.password;
        delete filtered.token;
        delete filtered.secret;
        delete filtered.authorization;
        
        // Truncate long values
        for (const [key, value] of Object.entries(filtered)) {
            if (typeof value === 'string' && value.length > 200) {
                filtered[key] = value.substring(0, 200) + '...[truncated]';
            }
        }
        
        return filtered;
    }

    /**
     * Log info message
     */
    info(message: string, context?: LogContext): void {
        console.log(this.formatLog('info', message, context));
    }

    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext): void {
        console.warn(this.formatLog('warn', message, context));
    }

    /**
     * Log error message
     */
    error(message: string, context?: LogContext): void {
        console.error(this.formatLog('error', message, context));
    }

    /**
     * Log debug message (only in development)
     */
    debug(message: string, context?: LogContext): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatLog('debug', message, context));
        }
    }

    /**
     * Log Redis operation
     */
    redis(operation: 'success' | 'failure', action: string, context?: LogContext): void {
        if (operation === 'success') {
            this.debug(`Redis: ${action}`, { ...context, redisOperation: action });
        } else {
            this.error(`Redis: ${action} failed`, { ...context, redisOperation: action });
        }
    }

    /**
     * Log mode change
     */
    mode(mode: 'normal' | 'degraded', reason?: string, context?: LogContext): void {
        const message = mode === 'degraded' 
            ? `System entering degraded mode${reason ? ': ' + reason : ''}`
            : 'System operating in normal mode';
        
        if (mode === 'degraded') {
            this.warn(message, { ...context, mode });
        } else {
            this.info(message, { ...context, mode });
        }
    }

    /**
     * Log critical exam events
     */
    examEvent(event: string, context: LogContext): void {
        const eventEmojis: Record<string, string> = {
            'exam_started': '🎯',
            'exam_submitted': '✅',
            'exam_auto_submitted': '⏰',
            'duplicate_submit': '🔁',
            'rate_limit_exceeded': '🚫',
            'rate_limit_bypassed': '⚠️'
        };

        const emoji = eventEmojis[event] || 'ℹ️';
        console.log(`${emoji} ${event} | ${this.serializeContext(context)}`);
    }
}

// Singleton instance
const logger = new Logger();

export { logger };
