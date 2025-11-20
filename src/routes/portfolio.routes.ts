import { Router, Request, Response } from 'express';
import { portfolioService } from '../services/portfolio.service';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/portfolio/summary
 * Get portfolio summary with current values and gains
 */
router.get(
  '/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const summary = await portfolioService.getPortfolioSummary(userId);
    res.json({
      status: 'success',
      data: summary,
    });
  })
);

/**
 * GET /api/v1/portfolio/metrics
 * Get portfolio risk and performance metrics
 */
router.get(
  '/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const metrics = await portfolioService.getPortfolioMetrics(userId);
    res.json({
      status: 'success',
      data: metrics,
    });
  })
);

/**
 * GET /api/v1/portfolio/correlation
 * Get correlation matrix between holdings
 */
router.get(
  '/correlation',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const correlation = await portfolioService.getCorrelationMatrix(userId);
    res.json({
      status: 'success',
      data: correlation,
    });
  })
);

/**
 * GET /api/v1/portfolio/performance
 * Get portfolio performance history
 */
router.get(
  '/performance',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { period } = req.query;

    const validPeriods = ['1W', '1M', '3M', '6M', '1Y'];
    const selectedPeriod = validPeriods.includes(period as string)
      ? (period as '1W' | '1M' | '3M' | '6M' | '1Y')
      : '1M';

    const performance = await portfolioService.getPerformanceHistory(userId, selectedPeriod);
    res.json({
      status: 'success',
      data: performance,
    });
  })
);

export default router;
