// types/api/SlidingWindowRateLimiter.ts
import { IRateLimiter } from './IRateLimiter';

interface RequestTimestamp {
  timestamp: number;
}

export class SlidingWindowRateLimiter implements IRateLimiter {
  public limit: number;
  public interval: number;
  public get remainingRequests(): number {
    this.pruneOldRequests();
    return this.limit - this.requestTimestamps.length;
  }
  
  private requestTimestamps: RequestTimestamp[] = [];
  
  /**
   * Creates a new sliding window rate limiter
   * @param limit Maximum number of requests allowed in the time interval
   * @param interval Time interval in milliseconds
   */
  constructor(limit: number, interval: number) {
    this.limit = limit;
    this.interval = interval;
  }
  
  public canMakeRequest(): boolean {
    return this.remainingRequests > 0;
  }
  
  public recordRequest(): void {
    this.pruneOldRequests();
    if (this.requestTimestamps.length < this.limit) {
      this.requestTimestamps.push({ timestamp: Date.now() });
    }
  }
  
  public resetCounter(): void {
    this.requestTimestamps = [];
  }
  
  private pruneOldRequests(): void {
    const now = Date.now();
    const cutoff = now - this.interval;
    this.requestTimestamps = this.requestTimestamps.filter(
      request => request.timestamp > cutoff
    );
  }
}