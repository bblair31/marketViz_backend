import { Router, Request, Response } from 'express';
import { alphaVantageService } from '../services/alphaVantage.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/v1/economic/gdp
 * Get Real GDP data
 */
router.get(
  '/gdp',
  asyncHandler(async (req: Request, res: Response) => {
    const { interval } = req.query;
    const data = await alphaVantageService.getRealGDP(
      (interval as 'annual' | 'quarterly') || 'annual'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/treasury-yield
 * Get Treasury Yield data
 */
router.get(
  '/treasury-yield',
  asyncHandler(async (req: Request, res: Response) => {
    const { interval, maturity } = req.query;
    const data = await alphaVantageService.getTreasuryYield(
      (interval as 'daily' | 'weekly' | 'monthly') || 'monthly',
      (maturity as '3month' | '2year' | '5year' | '7year' | '10year' | '30year') || '10year'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/federal-funds-rate
 * Get Federal Funds Rate
 */
router.get(
  '/federal-funds-rate',
  asyncHandler(async (req: Request, res: Response) => {
    const { interval } = req.query;
    const data = await alphaVantageService.getFederalFundsRate(
      (interval as 'daily' | 'weekly' | 'monthly') || 'monthly'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/cpi
 * Get Consumer Price Index
 */
router.get(
  '/cpi',
  asyncHandler(async (req: Request, res: Response) => {
    const { interval } = req.query;
    const data = await alphaVantageService.getCPI(
      (interval as 'monthly' | 'semiannual') || 'monthly'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/inflation
 * Get Inflation rate
 */
router.get(
  '/inflation',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await alphaVantageService.getInflation();
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/retail-sales
 * Get Retail Sales data
 */
router.get(
  '/retail-sales',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await alphaVantageService.getRetailSales();
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/durable-goods
 * Get Durable Goods Orders
 */
router.get(
  '/durable-goods',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await alphaVantageService.getDurableGoods();
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/unemployment
 * Get Unemployment Rate
 */
router.get(
  '/unemployment',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await alphaVantageService.getUnemployment();
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/economic/nonfarm-payroll
 * Get Nonfarm Payroll
 */
router.get(
  '/nonfarm-payroll',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await alphaVantageService.getNonfarmPayroll();
    res.json({
      status: 'success',
      data,
    });
  })
);

export default router;
