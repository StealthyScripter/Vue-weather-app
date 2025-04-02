// types/base/BaseService.ts
import { ILogger } from '../logging/ILogger';
import { IAnalyticsData } from '../analytics/IAnalyticsData';

export abstract class BaseService {
  protected logger: ILogger;
  
  constructor(logger: ILogger) {
    this.logger = logger;
  }
  
  /**
   * Initializes the service
   */
  public abstract initialize(): Promise<void>;
  
  /**
   * Checks if the service is healthy and operational
   */
  public abstract healthCheck(): Promise<boolean>;
  
  /**
   * Records analytics data for monitoring and reporting
   */
  public abstract recordAnalytics(data: IAnalyticsData): void;
}