import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import config from '../config';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Determine status code and message
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date()
  });
};

// Not found middleware
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    timestamp: new Date()
  });
};