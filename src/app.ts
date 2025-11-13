import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { config } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import routes (will create these next)
import authRoutes from './routes/auth.routes';
import marketRoutes from './routes/market.routes';
import watchlistRoutes from './routes/watchlist.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/market', marketRoutes);
  app.use('/api/v1/watchlist', watchlistRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('✅ Express app configured');

  return app;
};
