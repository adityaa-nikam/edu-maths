import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares';

const router = Router();

// Public health check - no auth required
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Auth routes are working',
  });
});

// Protected route example - demonstrates middleware usage
router.get('/me', authenticateTeacher, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    userId: req.clerkUserId,
  });
});

export default router;
