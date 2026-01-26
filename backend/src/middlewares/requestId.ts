/**
 * Request ID Middleware
 * 
 * Generates unique correlation IDs for each request to enable request tracing.
 * 
 * PURPOSE:
 * - Track requests across multiple operations
 * - Enable log correlation for debugging
 * - Provide visibility into request flow
 * 
 * BEHAVIOR:
 * - Generates UUID for each request
 * - Attaches to req.requestId
 * - Includes in response headers (X-Request-ID)
 * - Enables structured logging with correlation
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

/**
 * Middleware to generate and attach request ID
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Use existing request ID from header if present, otherwise generate new one
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    
    // Attach to request object
    req.requestId = requestId;
    
    // Include in response headers for client-side correlation
    res.setHeader('X-Request-ID', requestId);
    
    next();
}
