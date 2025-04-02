// types/api/IRateLimiter.ts
export interface IRateLimiter {
    /**
     * The maximum number of requests allowed in the time interval
     */
    limit: number;
    
    /**
     * Time interval in milliseconds
     */
    interval: number;
    
    /**
     * Number of requests remaining in the current interval
     */
    remainingRequests: number;
    
    /**
     * Checks if a request can be made without exceeding the rate limit
     */
    canMakeRequest(): boolean;
    
    /**
     * Records that a request has been made
     */
    recordRequest(): void;
    
    /**
     * Resets the request counter
     */
    resetCounter(): void;
  }