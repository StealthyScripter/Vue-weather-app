// src/middlewares/analyticsMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';

export const trackRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Record start time
  const startTime = Date.now();
  
  // Save original end method to intercept it
  const originalEnd = res.end;
  
  // Override end method to capture response data
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Record analytics
    analyticsService.record({
      endpoint: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      responseTime,
      statusCode: res.statusCode
    });
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};