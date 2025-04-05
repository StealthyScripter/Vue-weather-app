// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import logger from './utils/logger';
import weatherMapRoutes from './routes/weatherMapRoutes';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoute';
import systemRoutes from './routes/systemRoutes';
import { errorHandler } from './middlewares/errorMiddleware';
import { trackRequest } from './middlewares/analyticsMiddleware';

// Basic Express app setup
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(trackRequest);// Add analytics tracking

// Protect weather map routes with authentication - fixed version
import { authenticate } from './utils/authMiddleware';
app.use('/api/weather-map', authenticate as express.RequestHandler, weatherMapRoutes);



// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/weather-map', weatherMapRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: config.nodeEnv
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date()
  });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});