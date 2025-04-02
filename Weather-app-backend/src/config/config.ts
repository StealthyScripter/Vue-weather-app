import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    mapboxApiKey: process.env.MAPBOX_API_KEY || '',
    weatherApiKey: process.env.WEATHER_API_KEY || '',
    cacheTTL: parseInt(process.env.CACHE_TTL || '300'),
    nodeEnv: process.env.NODE_ENV || 'development',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
  };

export default config;