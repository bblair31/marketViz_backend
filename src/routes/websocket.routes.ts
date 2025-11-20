import { Router, Request, Response } from 'express';
import { websocketService } from '../services/websocket.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/v1/websocket/stats
 * Get WebSocket connection statistics
 */
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = websocketService.getStats();
    res.json({
      status: 'success',
      data: stats,
    });
  })
);

/**
 * GET /api/v1/websocket/health
 * Check WebSocket server health
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const io = websocketService.getIO();
    res.json({
      status: 'success',
      data: {
        healthy: io !== null,
        message: io ? 'WebSocket server is running' : 'WebSocket server not initialized',
      },
    });
  })
);

export default router;
