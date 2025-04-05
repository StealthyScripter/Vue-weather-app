// src/routes/systemRoutes.ts
import express from 'express';
import os from 'os';
import { ApiError } from '../middlewares/errorHandler';
import { globalCache } from '../services/cacheService';
import logger from '../utils/logger';
import config from '../config';
import { authenticate, authorize } from '../utils/authMiddleware';

const router = express.Router();

// Basic health check
router.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    environment: config.nodeEnv
  });
});

// Detailed system information (protected)
router.get(
  '/info',
  authenticate as express.RequestHandler,
  authorize(['admin']) as express.RequestHandler,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      // Get cache statistics
      const cacheStats = await globalCache.getStats();
      
      res.json({
        success: true,
        data: {
          system: {
            platform: process.platform,
            architecture: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: {
              total: os.totalmem(),
              free: os.freemem(),
              usage: process.memoryUsage()
            },
            cpu: os.cpus(),
            loadAverage: os.loadavg()
          },
          application: {
            environment: config.nodeEnv,
            startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
            cache: cacheStats
          }
        },
        timestamp: new Date()
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;