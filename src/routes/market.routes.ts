import { Router, Request, Response } from 'express';
import { alphaVantageService } from '../services/alphaVantage.service';
import { watchlistService } from '../services/watchlist.service';
import { optionalAuthenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * GET /api/v1/market/quote/:symbol
 * Get real-time quote for a symbol
 */
router.get(
  '/quote/:symbol',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const quote = await alphaVantageService.getQuote(symbol);
    res.json({
      status: 'success',
      data: quote,
    });
  })
);

/**
 * GET /api/v1/market/daily/:symbol
 * Get daily time series data
 */
router.get(
  '/daily/:symbol',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const outputSize = (req.query.outputsize as 'compact' | 'full') || 'compact';
    const data = await alphaVantageService.getTimeSeriesDaily(symbol, outputSize);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/intraday/:symbol
 * Get intraday time series data
 */
router.get(
  '/intraday/:symbol',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const interval = (req.query.interval as '1min' | '5min' | '15min' | '30min' | '60min') || '5min';
    const data = await alphaVantageService.getTimeSeriesIntraday(symbol, interval);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/search
 * Search for symbols
 */
router.get(
  '/search',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new BadRequestError('Search query parameter "q" is required');
    }

    const results = await alphaVantageService.searchSymbols(q);

    // Record search if user is authenticated
    if (req.user) {
      await watchlistService.recordSearch(req.user.userId, q);
    }

    res.json({
      status: 'success',
      data: results,
    });
  })
);

/**
 * GET /api/v1/market/overview/:symbol
 * Get company overview
 */
router.get(
  '/overview/:symbol',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const data = await alphaVantageService.getCompanyOverview(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/top-movers
 * Get top gainers and losers
 */
router.get(
  '/top-movers',
  asyncHandler(async (_req, res) => {
    const data = await alphaVantageService.getTopGainersLosers();
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/news
 * Get market news (optionally filtered by tickers)
 */
router.get(
  '/news',
  asyncHandler(async (req, res) => {
    const { tickers, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const data = await alphaVantageService.getNewsSentiment(
      tickers as string | undefined,
      limitNum
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/crypto/:symbol
 * Get cryptocurrency quote
 */
router.get(
  '/crypto/:symbol',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { market } = req.query;
    const data = await alphaVantageService.getCryptoQuote(symbol, (market as string) || 'USD');
    res.json({
      status: 'success',
      data,
    });
  })
);

export default router;
