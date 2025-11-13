import { Router } from 'express';
import { watchlistService } from '../services/watchlist.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addToWatchlistSchema, removeFromWatchlistSchema } from '../validators/watchlist.validator';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All watchlist routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/watchlist
 * Get user's watchlist with current prices
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const watchlist = await watchlistService.getWatchlist(req.user!.userId);
    res.json({
      status: 'success',
      data: watchlist,
    });
  })
);

/**
 * POST /api/v1/watchlist
 * Add stock to watchlist
 */
router.post(
  '/',
  validate(addToWatchlistSchema),
  asyncHandler(async (req, res) => {
    const transaction = await watchlistService.addToWatchlist(req.user!.userId, req.body);
    res.status(201).json({
      status: 'success',
      data: transaction,
    });
  })
);

/**
 * DELETE /api/v1/watchlist/:symbol
 * Remove stock from watchlist
 */
router.delete(
  '/:symbol',
  validate(removeFromWatchlistSchema),
  asyncHandler(async (req, res) => {
    const result = await watchlistService.removeFromWatchlist(
      req.user!.userId,
      req.params.symbol
    );
    res.json({
      status: 'success',
      data: result,
    });
  })
);

/**
 * GET /api/v1/watchlist/news
 * Get news for watchlist stocks
 */
router.get(
  '/news',
  asyncHandler(async (req, res) => {
    const news = await watchlistService.getWatchlistNews(req.user!.userId);
    res.json({
      status: 'success',
      data: news,
    });
  })
);

/**
 * GET /api/v1/watchlist/searches
 * Get user's search history
 */
router.get(
  '/searches',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const searches = await watchlistService.getSearchHistory(req.user!.userId, limit);
    res.json({
      status: 'success',
      data: searches,
    });
  })
);

export default router;
