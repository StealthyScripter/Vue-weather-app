// types/base/ICacheable.ts
export interface ICacheable {
    /**
     * Returns a unique string key for caching the object
     */
    getCacheKey(): string;
    
    /**
     * Returns the time-to-live in seconds for this item in cache
     */
    getTTL(): number;
  }