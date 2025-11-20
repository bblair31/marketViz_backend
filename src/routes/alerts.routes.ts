import { Router, Request, Response } from 'express';
import { alertsService, AlertCondition, AlertStatus } from '../services/alerts.service';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const router = Router();

// All alerts routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/alerts
 * Create a new price alert
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { symbol, condition, targetPrice, note } = req.body;

    if (!symbol || !condition || targetPrice === undefined) {
      throw new BadRequestError('Symbol, condition, and targetPrice are required');
    }

    const validConditions: AlertCondition[] = ['ABOVE', 'BELOW', 'CROSSES_ABOVE', 'CROSSES_BELOW'];
    if (!validConditions.includes(condition)) {
      throw new BadRequestError(
        `Invalid condition. Must be one of: ${validConditions.join(', ')}`
      );
    }

    if (typeof targetPrice !== 'number' || targetPrice <= 0) {
      throw new BadRequestError('Target price must be a positive number');
    }

    const alert = await alertsService.createAlert({
      userId,
      symbol,
      condition,
      targetPrice,
      note,
    });

    res.status(201).json({
      status: 'success',
      data: alert,
    });
  })
);

/**
 * GET /api/v1/alerts
 * Get all user alerts
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { status } = req.query;

    let alertStatus: AlertStatus | undefined;
    if (status) {
      const validStatuses: AlertStatus[] = ['ACTIVE', 'TRIGGERED', 'CANCELLED'];
      if (!validStatuses.includes(status as AlertStatus)) {
        throw new BadRequestError(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        );
      }
      alertStatus = status as AlertStatus;
    }

    const alerts = await alertsService.getUserAlerts(userId, alertStatus);

    res.json({
      status: 'success',
      data: alerts,
    });
  })
);

/**
 * GET /api/v1/alerts/stats
 * Get alert statistics for user
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const stats = await alertsService.getAlertStats(userId);

    res.json({
      status: 'success',
      data: stats,
    });
  })
);

/**
 * POST /api/v1/alerts/check
 * Check all active alerts against current prices
 */
router.post(
  '/check',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const results = await alertsService.checkUserAlerts(userId);

    const triggered = results.filter((r) => r.triggered);
    const active = results.filter((r) => !r.triggered);

    res.json({
      status: 'success',
      data: {
        checked: results.length,
        triggered: triggered.length,
        active: active.length,
        results,
      },
    });
  })
);

/**
 * GET /api/v1/alerts/:id
 * Get a specific alert
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const alertId = parseInt(req.params.id, 10);

    if (isNaN(alertId)) {
      throw new BadRequestError('Invalid alert ID');
    }

    const alert = await alertsService.getAlert(alertId, userId);

    res.json({
      status: 'success',
      data: alert,
    });
  })
);

/**
 * PUT /api/v1/alerts/:id
 * Update an alert
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const alertId = parseInt(req.params.id, 10);
    const { condition, targetPrice, note } = req.body;

    if (isNaN(alertId)) {
      throw new BadRequestError('Invalid alert ID');
    }

    if (condition) {
      const validConditions: AlertCondition[] = ['ABOVE', 'BELOW', 'CROSSES_ABOVE', 'CROSSES_BELOW'];
      if (!validConditions.includes(condition)) {
        throw new BadRequestError(
          `Invalid condition. Must be one of: ${validConditions.join(', ')}`
        );
      }
    }

    if (targetPrice !== undefined && (typeof targetPrice !== 'number' || targetPrice <= 0)) {
      throw new BadRequestError('Target price must be a positive number');
    }

    const alert = await alertsService.updateAlert(alertId, userId, {
      condition,
      targetPrice,
      note,
    });

    res.json({
      status: 'success',
      data: alert,
    });
  })
);

/**
 * POST /api/v1/alerts/:id/cancel
 * Cancel an alert
 */
router.post(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const alertId = parseInt(req.params.id, 10);

    if (isNaN(alertId)) {
      throw new BadRequestError('Invalid alert ID');
    }

    const alert = await alertsService.cancelAlert(alertId, userId);

    res.json({
      status: 'success',
      data: alert,
    });
  })
);

/**
 * DELETE /api/v1/alerts/:id
 * Delete an alert
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const alertId = parseInt(req.params.id, 10);

    if (isNaN(alertId)) {
      throw new BadRequestError('Invalid alert ID');
    }

    await alertsService.deleteAlert(alertId, userId);

    res.json({
      status: 'success',
      data: {
        message: 'Alert deleted successfully',
      },
    });
  })
);

export default router;
