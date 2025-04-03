import logger from './logger';

export interface IRateLimiter {
  limit: number;
  interval: number;
  remainingRequests: number;
  canMakeRequest(): boolean;
  recordRequest(): void;
  resetCounter(): void;
}

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
    
    logger.info(`Created rate limiter with limit ${limit} per ${interval}ms`);
  }
  
  public canMakeRequest(): boolean {
    this.checkWindowReset();
    return this.remainingRequests > 0;
  }
  
  public recordRequest(): void {
    this.checkWindowReset();
    if (this.remainingRequests > 0) {
      this.remainingRequests--;
      logger.debug(`Rate limiter: ${this.remainingRequests}/${this.limit} requests remaining`);
    }
  }
  
  public resetCounter(): void {
    this.remainingRequests = this.limit;
    this.windowStart = Date.now();
    logger.debug(`Rate limiter reset. ${this.limit} requests available.`);
  }
  
  private checkWindowReset(): void {
    const now = Date.now();
    if (now - this.windowStart > this.interval) {
      logger.debug(`Rate limit window expired. Resetting counter.`);
      this.resetCounter();
    }
  }
}