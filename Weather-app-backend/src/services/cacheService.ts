import { createClient, RedisClientType } from 'redis';
import NodeCache from 'node-cache';
import logger from '../utils/logger';
import config from '../config';

// Interface for cache options
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export class CacheService<T> {
  private redisClient: RedisClientType | null = null;
  private memoryCache: NodeCache;
  private isRedisConnected = false;

  constructor() {
    // Initialize in-memory cache
    this.memoryCache = new NodeCache({
      stdTTL: config.cacheTTL,
      checkperiod: 120
    });

    // Initialize Redis client if URL is provided
    if (config.redisUrl) {
      try {
        this.redisClient = createClient({ url: config.redisUrl });
        
        this.redisClient.on('error', (err) => {
          logger.error(`Redis client error: ${err.message}`);
          this.isRedisConnected = false;
        });

        this.redisClient.on('connect', () => {
          logger.info('Redis client connected');
          this.isRedisConnected = true;
        });

        this.redisClient.connect().catch((err) => {
          logger.error(`Redis connection error: ${err.message}`);
        });
      } catch (error) {
        logger.error(`Failed to initialize Redis client: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      logger.warn('Redis URL not provided, using in-memory cache only');
    }

    logger.info('Cache service initialized');
  }
  
  /**
   * Get an item from the cache
   * @param key Cache key
   */
  public async get<T>(key: string): Promise<T | null> {
    // Try Redis first if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        if (value) {
          logger.debug(`Cache hit (Redis): ${key}`);
          return JSON.parse(value) as T;
        }
      } catch (error) {
        logger.error(`Redis get error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const value = this.memoryCache.get<T>(key);
      if (value !== undefined) {
      logger.debug(`Cache hit (Memory): ${key}`);
      return value;
    }

    logger.debug(`Cache miss: ${key}`);
    return null;
  }
  
  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (overrides default)
   */
  public async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || config.cacheTTL;

    // Set in Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        logger.debug(`Value set in Redis cache: ${key}`);
      } catch (error) {
        logger.error(`Redis set error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Also set in in-memory cache as fallback
    this.memoryCache.set(key, value, ttl);
    logger.debug(`Value set in memory cache: ${key}`);
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  public async delete(key: string): Promise<void> {
    // Delete from Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
        logger.debug(`Value deleted from Redis cache: ${key}`);
      } catch (error) {
        logger.error(`Redis delete error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Delete from in-memory cache
    this.memoryCache.del(key);
    logger.debug(`Value deleted from memory cache: ${key}`);
  }

  /**
   * Clear all cache
   */
  public async clear(): Promise<void> {
    // Clear Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.flushAll();
        logger.info('Redis cache cleared');
      } catch (error) {
        logger.error(`Redis flush error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Clear in-memory cache
    this.memoryCache.flushAll();
    logger.info('Memory cache cleared');
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<{
    hits: number;
    misses: number;
    keys: number;
    redisConnected: boolean;
  }> {
    const memStats = this.memoryCache.getStats();
    
    let redisKeys = 0;
    if (this.isRedisConnected && this.redisClient) {
      try {
        redisKeys = await this.redisClient.dbSize();
      } catch (error) {
        logger.error(`Redis dbSize error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      hits: memStats.hits,
      misses: memStats.misses,
      keys: this.memoryCache.keys().length + redisKeys,
      redisConnected: this.isRedisConnected
    };
  }
}

// Create and export a singleton instance for general use
export const globalCache = new CacheService();