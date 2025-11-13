import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware to generate and attach a unique request ID to each request
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if request ID is provided in header, otherwise generate new one
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};
