import responseTime from 'response-time';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Performance monitoring middleware
 * Tracks response times and logs slow requests
 */

// Threshold for slow requests in milliseconds
const SLOW_REQUEST_THRESHOLD = 1000;

export const performanceMonitoring = responseTime((req, res, time) => {
  const timeInMs = time.toFixed(2);
  const expressReq = req as Request;
  const expressRes = res as Response;

  // Log slow requests
  if (time > SLOW_REQUEST_THRESHOLD) {
    logger.warn(`Slow request detected: ${req.method} ${req.url}`, {
      requestId: (expressReq as any).requestId,
      method: req.method,
      path: req.url,
      responseTime: `${timeInMs}ms`,
      threshold: `${SLOW_REQUEST_THRESHOLD}ms`,
    });
  }

  // Add response time header
  expressRes.setHeader('X-Response-Time', `${timeInMs}ms`);
});

/**
 * Get performance metrics for health check
 */
export const getPerformanceMetrics = () => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return {
    uptime: {
      seconds: uptime.toFixed(2),
      formatted: formatUptime(uptime),
    },
    memory: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
    },
    cpu: process.cpuUsage(),
  };
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours}h ${minutes}m ${secs}s`;
}
