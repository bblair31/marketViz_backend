import { Router, Request, Response } from 'express';
import { screenerService } from '../services/screener.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * POST /api/v1/screener
 * Screen stocks based on filters
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { filters, symbols, limit } = req.body;

    if (!filters || typeof filters !== 'object') {
      throw new BadRequestError('Filters object is required');
    }

    const results = await screenerService.screenStocks(
      filters,
      symbols,
      limit || 20
    );

    res.json({
      status: 'success',
      data: results,
    });
  })
);

/**
 * GET /api/v1/screener/presets
 * Get preset screener configurations
 */
router.get(
  '/presets',
  asyncHandler(async (_req: Request, res: Response) => {
    const presets = screenerService.getPresetScreeners();
    res.json({
      status: 'success',
      data: presets,
    });
  })
);

/**
 * GET /api/v1/screener/presets/:preset
 * Run a preset screener
 */
router.get(
  '/presets/:preset',
  asyncHandler(async (req: Request, res: Response) => {
    const { preset } = req.params;
    const { limit } = req.query;

    const presets = screenerService.getPresetScreeners();
    const presetFilters = presets[preset];

    if (!presetFilters) {
      throw new BadRequestError(
        `Invalid preset. Available presets: ${Object.keys(presets).join(', ')}`
      );
    }

    const results = await screenerService.screenStocks(
      presetFilters,
      undefined,
      limit ? parseInt(limit as string, 10) : 20
    );

    res.json({
      status: 'success',
      preset,
      data: results,
    });
  })
);

/**
 * GET /api/v1/screener/sectors
 * Get available sectors for filtering
 */
router.get(
  '/sectors',
  asyncHandler(async (_req: Request, res: Response) => {
    const sectors = screenerService.getAvailableSectors();
    res.json({
      status: 'success',
      data: sectors,
    });
  })
);

export default router;
