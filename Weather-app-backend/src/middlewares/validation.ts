import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

// Validation middleware for request data
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body, query, and params
      const { error } = schema.validate({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      if (error) {
        throw new ApiError(error.message, 400);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};