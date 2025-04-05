// src/routes/analyticsRoutes.ts
import express from 'express';
import { analyticsService } from '../services/analyticsService';
import { authenticate, authorize } from '../utils/authMiddleware';
import logger from '../utils/logger';

const router = express.Router();

// Get daily report - protected for admin only
router.get('/report/:date', authenticate as express.RequestHandler, authorize(['admin']) as express.RequestHandler, async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const dateParam = req.params.date;
    let reportDate: Date | undefined = undefined;
    
    if (dateParam) {
      reportDate = new Date(dateParam);
      // Check if date is valid
      if (isNaN(reportDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
          timestamp: new Date()
        });
      }
    }
    
    const report = await analyticsService.generateDailyReport(reportDate);
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error generating analytics report: ${error instanceof Error ? error.message : String(error)}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      timestamp: new Date()
    });
  }
});

export default router;