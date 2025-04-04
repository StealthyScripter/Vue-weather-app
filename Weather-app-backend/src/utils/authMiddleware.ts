// src/utils/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from './logger';

// Interface for decoded JWT token
interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from request headers, query parameters, or cookies
  const token = 
    req.headers.authorization?.split(' ')[1] || 
    req.query.token as string || 
    req.cookies?.token;
  
  if (!token) {
    logger.warn('Authentication failed: No token provided');
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date()
    });
    return;
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret as any) as DecodedToken;
    
    // Attach user info to request
    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error instanceof Error ? error.message : 'Invalid token'}`);
    
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date()
    });
  }
};

// Authorization middleware for specific roles
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    const userInfo = (req as any).user;

    if (!userInfo) {
      logger.warn('Authorization failed: User not authenticated');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }
    
    if (!roles.includes(userInfo.role)) {
      logger.warn(`Authorization failed: User role ${userInfo.role} not authorized`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date()
      });
      return;
    }
    
    next();
  };
};