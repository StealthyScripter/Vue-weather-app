// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  logger.info('Health check endpoint called');
  
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: config.nodeEnv
  });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});