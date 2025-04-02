// types/cache/MemoryCacheProvider.ts
import { CacheProvider } from './CacheProvider';
import NodeCache from 'node-cache';

export class MemoryCacheProvider<T> extends CacheProvider<T> {
  private cache: NodeCache;
  private hitCount: number = 0;
  private missCount: number = 0;
  
  constructor(defaultTTL?: number) {
    super();
    this.cache = new NodeCache({
      stdTTL: defaultTTL || 300, // 5 minutes default TTL
      checkperiod: 60
    });
  }
  
  public async get(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    
    if (value === undefined) {
      this.missCount++;
      return null;
    }
    
    this.hitCount++;
    return value;
  }
  
  public async set(key: string, value: T, ttl?: number ): Promise<void> {
    if (ttl !== undefined) {
        this.cache.set(key, value, ttl);
    } else {
        this.cache.set(key, value);
    }
    
  }
  
  public async delete(key: string): Promise<void> {
    this.cache.del(key);
  }
  
  public async clear(): Promise<void> {
    this.cache.flushAll();
  }
  
  public async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    return {
      hits: this.hitCount,
      misses: this.missCount,
      size: this.cache.keys().length
    };
  }
}