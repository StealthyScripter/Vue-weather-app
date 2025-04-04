// src/routes/authRoutes.ts
import express, { Application } from 'express';
import userService from '../services/userService';
import logger from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Define rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit to 5 requests per 15 minutes
    message: "Too many login attempts, please try again later."
  });

// Login route
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], loginLimiter, async (req: express.Request, res: express.Response): Promise<any> => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          timestamp: new Date()
        });
      }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date()
      });
      
    }
    
    const token = await userService.authenticate({ email, password });
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      data: { token },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Login error: ${error instanceof Error ? 'An error occurred during login' : 'Unknown error'}`);
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date()
    });
  }
});

export default router;
