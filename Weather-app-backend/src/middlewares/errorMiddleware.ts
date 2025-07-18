import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';
import config from '../config';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default status code and error message
  let statusCode = 500;
  let message = 'Internal server error';
  
  // If this is our custom AppError, use its status code and message
  if ('statusCode' in err) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Log the error
  logger.error(`${statusCode} - ${message}`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // In production, don't send error details
  const errorResponse = {
    success: false,
    error: config.nodeEnv === 'production' && statusCode === 500 ? 'Internal server error' : message,
    timestamp: new Date()
  };
  
  // Add stack trace in development
  if (config.nodeEnv === 'development' && statusCode === 500) {
    Object.assign(errorResponse, { stack: err.stack });
  }
  
  res.status(statusCode).json(errorResponse);
};