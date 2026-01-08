import { Request, Response, NextFunction } from 'express';


import { verifyStudentToken } from '../utils/jwt';

// Extend Express Request type to include auth from Clerk and Student JWT
declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
      studentId?: string;
      academyId?: string;
    }
  }
}

// Custom middleware wrapper that extracts userId from Clerk auth
export const authenticateTeacher = (req: Request, res: Response, next: NextFunction) => {
  // clerkMiddleware() in app.ts must run before this
  const auth = (req as any).auth();

  // Check if auth exists and has a userId
  if (!auth || !auth.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }

  req.clerkUserId = auth.userId;
  next();
};

export const authenticateStudent = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyStudentToken(token);
    req.studentId = payload.studentId;
    req.academyId = payload.academyId;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware compatibility wrapper to enforce academy isolation.
 * Checks if the JWT's academyId matches the requested resource's academyId.
 * @param source Where to find the academyId comparison value ('body', 'params', 'query')
 * @param key The key name (default: 'academyId')
 */
export const requireAcademyAccess = (source: 'body' | 'params' | 'query' = 'body', key: string = 'academyId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure user is authenticated first
    if (!req.academyId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Student not authenticated' });
    }

    // 2. Extract target academy ID
    const targetAcademyId = req[source][key];

    // 3. Skip check if not present (route specific - maybe 400? letting it pass for now if optional)
    if (!targetAcademyId) {
      return next();
    }

    // 4. Compare
    if (req.academyId !== targetAcademyId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You are not enrolled in this academy',
      });
    }

    next();
  };
};
