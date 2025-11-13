import { z } from 'zod';

export const addToWatchlistSchema = z.object({
  body: z.object({
    symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
    companyName: z.string().min(1, 'Company name is required'),
    priceBought: z.number().positive().optional(),
  }),
});

export const removeFromWatchlistSchema = z.object({
  params: z.object({
    symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  }),
});
