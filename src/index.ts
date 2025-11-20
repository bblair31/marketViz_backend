import { createServer } from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './database/client';
import { logger } from './utils/logger';
import { websocketService } from './services/websocket.service';

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Create HTTP server and attach WebSocket
    const httpServer = createServer(app);
    websocketService.initialize(httpServer);

    // Start server
    const server = httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`📊 API available at http://localhost:${config.port}/api/v1`);
      logger.info(`🔌 WebSocket server available at ws://localhost:${config.port}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
