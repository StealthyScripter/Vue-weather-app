// types/cache/RedisCacheProvider.ts
import { CacheProvider } from './CacheProvider';
import { MemoryCacheProvider } from './MemoryCacheProvider';
import { createClient, RedisClientType } from 'redis';
import { ILogger } from '../logging/ILogger';

export class RedisCacheProvider<T> extends CacheProvider<T> {
  private redisClient: RedisClientType;
  private fallbackCache: MemoryCacheProvider<T>;
  private logger: ILogger;
  private connected: boolean = false;
  private hitCount: number = 0;
  private missCount: number = 0;
  
  constructor(redisUrl: string, logger: ILogger, defaultTTL?: number) {
    super();
    this.redisClient = createClient({ url: redisUrl });
    this.fallbackCache = new MemoryCacheProvider<T>(defaultTTL);
    this.logger = logger;
    
    this.redisClient.on('error', (err) => {
      this.connected = false;
      this.logger.error(`Redis client error: ${err.message}`);
    });
    
    this.redisClient.on('connect', () => {
      this.connected = true;
      this.logger.info('Redis client connected');
    });
    
    this.redisClient.connect().catch((err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }
  
  public async get(key: string): Promise<T | null> {
    if (!this.connected) {
      return this.fallbackCache.get(key);
    }
    
    try {
      const value = await this.redisClient.get(key);
      
      if (!value) {
        this.missCount++;
        return null;
      }
      
      this.hitCount++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Redis get error: ${(error as Error).message}`);
      return this.fallbackCache.get(key);
    }
  }
  
  public async set(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.connected) {
      await this.fallbackCache.set(key, value, ttl);
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.redisClient.setEx(key, ttl, serializedValue);
      } else {
        await this.redisClient.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Redis set error: ${(error as Error).message}`);
      await this.fallbackCache.set(key, value, ttl);
    }
  }
  
  public async delete(key: string): Promise<void> {
    if (this.connected) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        this.logger.error(`Redis delete error: ${(error as Error).message}`);
      }
    }
    
    // Also delete from fallback cache
    await this.fallbackCache.delete(key);
  }
  
  public async clear(): Promise<void> {
    if (this.connected) {
      try {
        await this.redisClient.flushAll();
      } catch (error) {
        this.logger.error(`Redis flush error: ${(error as Error).message}`);
      }
    }
    
    await this.fallbackCache.clear();
  }
  
  public async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    let size = 0;
    
    if (this.connected) {
      try {
        size = await this.redisClient.dbSize();
      } catch (error) {
        this.logger.error(`Redis dbSize error: ${(error as Error).message}`);
        const fallbackStats = await this.fallbackCache.getStats();
        size = fallbackStats.size;
      }
    } else {
      const fallbackStats = await this.fallbackCache.getStats();
      size = fallbackStats.size;
    }
    
    return {
      hits: this.hitCount,
      misses: this.missCount,
      size
    };
  }
}