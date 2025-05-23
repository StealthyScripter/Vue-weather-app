// types/api/FixedWindowRateLimiter.ts
import { IRateLimiter } from './IRateLimiter';

export class FixedWindowRateLimiter implements IRateLimiter {
  public limit: number;
  public interval: number;
  public remainingRequests: number;
  private windowStart: number;
  
  /**
   * Creates a new fixed window rate limiter
   * @param limit Maximum number of requests allowed in the time interval
   * @param interval Time interval in milliseconds
   */
  constructor(limit: number, interval: number) {
    this.limit = limit;
    this.interval = interval;
    this.remainingRequests = limit;
    this.windowStart = Date.now();
  }
  
  public canMakeRequest(): boolean {
    this.checkWindowReset();
    return this.remainingRequests > 0;
  }
  
  public recordRequest(): void {
    this.checkWindowReset();
    if (this.remainingRequests > 0) {
      this.remainingRequests--;
    }
  }
  
  public resetCounter(): void {
    this.remainingRequests = this.limit;
    this.windowStart = Date.now();
  }
  
  private checkWindowReset(): void {
    const now = Date.now();
    if (now - this.windowStart > this.interval) {
      this.resetCounter();
    }
  }
}