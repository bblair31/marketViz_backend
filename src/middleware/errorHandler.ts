import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    name: err.name,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(config.isDevelopment && { stack: err.stack }),
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const field = (prismaError.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        status: 'error',
        message: `A record with this ${field} already exists`,
      });
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Record not found',
      });
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid reference to related record',
      });
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid data provided',
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    status: 'error',
    message: config.isDevelopment ? err.message : 'Internal server error',
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.url} not found`,
  });
};
