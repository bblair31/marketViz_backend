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

// ==========================================
// TECHNICAL INDICATORS
// ==========================================

/**
 * GET /api/v1/market/indicators/:symbol
 * Get technical indicator for a symbol
 * Query params: indicator (required), interval, period, series_type
 */
router.get(
  '/indicators/:symbol',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { indicator, interval, period, series_type } = req.query;

    if (!indicator || typeof indicator !== 'string') {
      throw new BadRequestError('Indicator query parameter is required');
    }

    const data = await alphaVantageService.getTechnicalIndicator(
      symbol,
      indicator,
      (interval as any) || 'daily',
      period ? parseInt(period as string, 10) : 14,
      (series_type as any) || 'close'
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/rsi
 * Get RSI for a symbol
 */
router.get(
  '/indicators/:symbol/rsi',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval, period } = req.query;

    const data = await alphaVantageService.getRSI(
      symbol,
      (interval as any) || 'daily',
      period ? parseInt(period as string, 10) : 14
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/macd
 * Get MACD for a symbol
 */
router.get(
  '/indicators/:symbol/macd',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval, fast_period, slow_period, signal_period } = req.query;

    const data = await alphaVantageService.getMACD(
      symbol,
      (interval as any) || 'daily',
      fast_period ? parseInt(fast_period as string, 10) : 12,
      slow_period ? parseInt(slow_period as string, 10) : 26,
      signal_period ? parseInt(signal_period as string, 10) : 9
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/bbands
 * Get Bollinger Bands for a symbol
 */
router.get(
  '/indicators/:symbol/bbands',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval, period, nbdevup, nbdevdn } = req.query;

    const data = await alphaVantageService.getBollingerBands(
      symbol,
      (interval as any) || 'daily',
      period ? parseInt(period as string, 10) : 20,
      nbdevup ? parseInt(nbdevup as string, 10) : 2,
      nbdevdn ? parseInt(nbdevdn as string, 10) : 2
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/sma
 * Get SMA for a symbol
 */
router.get(
  '/indicators/:symbol/sma',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval, period } = req.query;

    const data = await alphaVantageService.getSMA(
      symbol,
      (interval as any) || 'daily',
      period ? parseInt(period as string, 10) : 20
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/ema
 * Get EMA for a symbol
 */
router.get(
  '/indicators/:symbol/ema',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval, period } = req.query;

    const data = await alphaVantageService.getEMA(
      symbol,
      (interval as any) || 'daily',
      period ? parseInt(period as string, 10) : 20
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/adx
 * Get ADX for a symbol
 */
router.get(
  '/indicators/:symbol/adx',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval, period } = req.query;

    const data = await alphaVantageService.getADX(
      symbol,
      (interval as any) || 'daily',
      period ? parseInt(period as string, 10) : 14
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/stoch
 * Get Stochastic Oscillator for a symbol
 */
router.get(
  '/indicators/:symbol/stoch',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval } = req.query;

    const data = await alphaVantageService.getStochastic(
      symbol,
      (interval as any) || 'daily'
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/atr
 * Get ATR for a symbol
 */
router.get(
  '/indicators/:symbol/atr',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval, period } = req.query;

    const data = await alphaVantageService.getATR(
      symbol,
      (interval as any) || 'daily',
      period ? parseInt(period as string, 10) : 14
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/indicators/:symbol/obv
 * Get OBV for a symbol
 */
router.get(
  '/indicators/:symbol/obv',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const { interval } = req.query;

    const data = await alphaVantageService.getOBV(
      symbol,
      (interval as any) || 'daily'
    );

    res.json({
      status: 'success',
      data,
    });
  })
);

// ==========================================
// FUNDAMENTAL DATA
// ==========================================

/**
 * GET /api/v1/market/fundamentals/:symbol/income
 * Get income statement
 */
router.get(
  '/fundamentals/:symbol/income',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const data = await alphaVantageService.getIncomeStatement(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/fundamentals/:symbol/balance
 * Get balance sheet
 */
router.get(
  '/fundamentals/:symbol/balance',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const data = await alphaVantageService.getBalanceSheet(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/fundamentals/:symbol/cashflow
 * Get cash flow statement
 */
router.get(
  '/fundamentals/:symbol/cashflow',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const data = await alphaVantageService.getCashFlow(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/fundamentals/:symbol/earnings
 * Get earnings data
 */
router.get(
  '/fundamentals/:symbol/earnings',
  asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const data = await alphaVantageService.getEarnings(symbol);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/calendar/earnings
 * Get earnings calendar
 */
router.get(
  '/calendar/earnings',
  asyncHandler(async (req: Request, res: Response) => {
    const { horizon } = req.query;
    const data = await alphaVantageService.getEarningsCalendar(
      (horizon as '3month' | '6month' | '12month') || '3month'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/calendar/ipo
 * Get IPO calendar
 */
router.get(
  '/calendar/ipo',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await alphaVantageService.getIPOCalendar();
    res.json({
      status: 'success',
      data,
    });
  })
);

// ==========================================
// FOREX
// ==========================================

/**
 * GET /api/v1/market/forex/rate
 * Get forex exchange rate
 */
router.get(
  '/forex/rate',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new BadRequestError('Both "from" and "to" currency parameters are required');
    }

    const data = await alphaVantageService.getForexRate(from as string, to as string);
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/forex/daily
 * Get forex daily time series
 */
router.get(
  '/forex/daily',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to, outputsize } = req.query;

    if (!from || !to) {
      throw new BadRequestError('Both "from" and "to" currency parameters are required');
    }

    const data = await alphaVantageService.getForexDaily(
      from as string,
      to as string,
      (outputsize as 'compact' | 'full') || 'compact'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/forex/intraday
 * Get forex intraday time series
 */
router.get(
  '/forex/intraday',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to, interval } = req.query;

    if (!from || !to) {
      throw new BadRequestError('Both "from" and "to" currency parameters are required');
    }

    const data = await alphaVantageService.getForexIntraday(
      from as string,
      to as string,
      (interval as any) || '5min'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

/**
 * GET /api/v1/market/forex/weekly
 * Get forex weekly time series
 */
router.get(
  '/forex/weekly',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new BadRequestError('Both "from" and "to" currency parameters are required');
    }

    const data = await alphaVantageService.getForexWeekly(from as string, to as string);
    res.json({
      status: 'success',
      data,
    });
  })
);

// ==========================================
// COMMODITIES
// ==========================================

/**
 * GET /api/v1/market/commodities/:commodity
 * Get commodity data
 */
router.get(
  '/commodities/:commodity',
  asyncHandler(async (req: Request, res: Response) => {
    const { commodity } = req.params;
    const { interval } = req.query;

    const validCommodities = ['WTI', 'BRENT', 'NATURAL_GAS', 'COPPER', 'ALUMINUM', 'WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE'];
    const upperCommodity = commodity.toUpperCase();

    if (!validCommodities.includes(upperCommodity)) {
      throw new BadRequestError(
        `Invalid commodity. Valid options: ${validCommodities.join(', ')}`
      );
    }

    const data = await alphaVantageService.getCommodity(
      upperCommodity as any,
      (interval as 'daily' | 'weekly' | 'monthly') || 'monthly'
    );
    res.json({
      status: 'success',
      data,
    });
  })
);

export default router;
