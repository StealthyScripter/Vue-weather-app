// types/cache/CacheProvider.ts
export abstract class CacheProvider<T> {
    /**
     * Retrieves a value from the cache
     * @param key Cache key
     */
    public abstract get(key: string): Promise<T | null>;
    
    /**
     * Stores a value in the cache
     * @param key Cache key
     * @param value Value to store
     * @param ttl Time-to-live in seconds (optional)
     */
    public abstract set(key: string, value: T, ttl?: number): Promise<void>;
    
    /**
     * Deletes a value from the cache
     * @param key Cache key
     */
    public abstract delete(key: string): Promise<void>;
    
    /**
     * Clears all values from the cache
     */
    public abstract clear(): Promise<void>;
    
    /**
     * Returns cache statistics
     */
    public abstract getStats(): Promise<{
      hits: number;
      misses: number;
      size: number;
    }>;
  }