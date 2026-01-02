import { Request, Response, NextFunction } from 'express';


// Extend Express Request type to include auth from Clerk
declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
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
