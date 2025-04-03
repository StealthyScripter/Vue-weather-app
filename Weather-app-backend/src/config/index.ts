// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface IConfig {
  nodeEnv: string;
  port: number;
  logLevel: string;
  logDirectory: string;
  analyticsDirectory: string;
  
  openMeteoBaseUrl: string;
  graphHopperBaseUrl: string;
  graphHopperApiKey: string;
  
  redisUrl: string;
  
  jwtSecret: string;
  jwtExpiry: string;
  
  cacheTTL: number;
}

const config: IConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  logDirectory: path.join(__dirname, '../../logs'),
  analyticsDirectory: path.join(__dirname, '../../analytics'),
  
  openMeteoBaseUrl: process.env.OPENMETEO_BASE_URL || 'https://api.open-meteo.com/v1',
  graphHopperBaseUrl: process.env.GRAPHHOPPER_BASE_URL || 'https://graphhopper.com/api/1',
  graphHopperApiKey: process.env.GRAPHHOPPER_API_KEY || '',
  
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key_for_dev',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  
  cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10),
};

export default config;