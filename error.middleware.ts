import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../types/errors';
import { config } from '../config';
import { logger } from '../config/logger';
import type { ApiResponse } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Normalize to AppError or generic 500
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Map Prisma errors to HTTP errors
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        code = 'CONFLICT';
        message = `Unique constraint failed on: ${JSON.stringify(err.meta?.target)}`;
        break;
      case 'P2025':
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        code = 'BAD_REQUEST';
        message = 'Foreign key constraint failed';
        break;
      default:
        statusCode = 500;
        code = 'DB_ERROR';
        message = 'Database error';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data provided';
  }

  // Log — operational errors at warn, unexpected at error
  const logData = {
    statusCode,
    code,
    method: req.method,
    url: req.url,
    requestId: (req as { requestId?: string }).requestId,
    ...(config.app.isDev && { stack: err.stack }),
  };

  if (statusCode >= 500) {
    logger.error({ err, ...logData }, message);
  } else {
    logger.warn(logData, message);
  }

  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      // Only include details + stack in non-prod
      ...(config.app.isDev && { details, stack: err.stack }),
      ...(!config.app.isDev && details !== undefined && { details }),
    },
  };

  res.status(statusCode).json(body);
}

// Catch unhandled 404s
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const err = new AppError(`Route not found: ${req.method} ${req.url}`, 404, 'NOT_FOUND');
  next(err);
}
