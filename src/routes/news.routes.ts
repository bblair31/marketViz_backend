import { Router, Request, Response } from 'express';
import { finnhubService } from '../services/finnhub.service';
import { alphaVantageService } from '../services/alphaVantage.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * GET /api/v1/news/market
 * Get general market news (breaking news from Finnhub)
 * Categories: general, forex, crypto, merger
 */
router.get(
  '/market',
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query;

    // Use Finnhub if configured, otherwise fall back to AlphaVantage
    if (finnhubService.isConfigured()) {
      const data = await finnhubService.getMarketNews(
        (category as 'general' | 'forex' | 'crypto' | 'merger') || 'general'
      );
      res.json({
        status: 'success',
        source: 'finnhub',
        data,
      });
    } else {
      // Fall back to AlphaVantage news
      const data = await alphaVantageService.getNewsSentiment(undefined, 50);
      res.json({
        status: 'success',
        source: 'alphavantage',
        data,
      });
    }
  })
);

/**
 * GET /api/v1/news/company/:symbol
 * Get company-specific news
 */
router.get(
  '/company/:symbol',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { from, to } = req.query;

    // Calculate default date range (last 7 days)
    const toDate = to ? (to as string) : new Date().toISOString().split('T')[0];
    const fromDate = from
      ? (from as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (finnhubService.isConfigured()) {
      const data = await finnhubService.getCompanyNews(symbol, fromDate, toDate);
      res.json({
        status: 'success',
        source: 'finnhub',
        data,
      });
    } else {
      // Fall back to AlphaVantage news filtered by ticker
      const data = await alphaVantageService.getNewsSentiment(symbol.toUpperCase(), 50);
      res.json({
        status: 'success',
        source: 'alphavantage',
        data,
      });
    }
  })
);

/**
 * GET /api/v1/news/sentiment/:symbol
 * Get news sentiment for a symbol (combines both sources)
 */
router.get(
  '/sentiment/:symbol',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;

    // Get AlphaVantage sentiment (always available)
    const alphaVantageData = await alphaVantageService.getNewsSentiment(symbol.toUpperCase(), 50);

    // Try to get Finnhub sentiment if available
    let finnhubData = null;
    if (finnhubService.isConfigured()) {
      try {
        finnhubData = await finnhubService.getNewsSentiment(symbol);
      } catch (error) {
        // Finnhub sentiment might not be available for all symbols
      }
    }

    res.json({
      status: 'success',
      data: {
        alphavantage: alphaVantageData,
        finnhub: finnhubData,
      },
    });
  })
);

/**
 * GET /api/v1/news/social/:symbol
 * Get social media sentiment (Reddit, Twitter mentions) - Finnhub only
 */
router.get(
  '/social/:symbol',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;

    if (!finnhubService.isConfigured()) {
      throw new BadRequestError('Social sentiment requires Finnhub API key to be configured');
    }

    const data = await finnhubService.getSocialSentiment(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/news/insider/:symbol
 * Get insider transactions - Finnhub only
 */
router.get(
  '/insider/:symbol',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;

    if (!finnhubService.isConfigured()) {
      throw new BadRequestError('Insider transactions require Finnhub API key to be configured');
    }

    const data = await finnhubService.getInsiderTransactions(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/news/institutional/:symbol
 * Get institutional ownership - Finnhub only
 */
router.get(
  '/institutional/:symbol',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;

    if (!finnhubService.isConfigured()) {
      throw new BadRequestError('Institutional ownership requires Finnhub API key to be configured');
    }

    const data = await finnhubService.getInstitutionalOwnership(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/news/market-status
 * Get market status (open/closed)
 */
router.get(
  '/market-status',
  asyncHandler(async (req: Request, res: Response) => {
    const { exchange } = req.query;

    if (!finnhubService.isConfigured()) {
      throw new BadRequestError('Market status requires Finnhub API key to be configured');
    }

    const data = await finnhubService.getMarketStatus((exchange as string) || 'US');
    res.json({
      status: 'success',
      data,
    });
  })
);

export default router;
