// types/analytics/MetricsService.ts
import { AnalyticsCollector } from './AnalyticsCollector';
import { IAnalyticsData } from './IAnalyticsData';
import { ILogger } from '../logging/ILogger';
import { CacheProvider } from '../cache/CacheProvider';

// Define types for reports to avoid using 'any'
export interface DailyMetricsReport {
    date?: string;
    totalCalls: number;
    successCalls: number;
    errorCalls: number;
    errorRate: string;
    averageResponseTime: number;
    endpointCounts: Record<string, number>;
    cacheStats: {
      hits: number;
      misses: number;
      hitRatio: string;
    };
    hourlyActivity: Record<string, number>;
    providerCounts: Record<string, number>;
    error?: string;
  }
  
  export interface AggregatedMetricsReport {
    startDate?: string;
    endDate?: string;
    dailyReports: DailyMetricsReport[];
    aggregated: DailyMetricsReport;
  }

export class MetricsService {
  private logger: ILogger;
  private analyticsCollector: AnalyticsCollector;
  private metricsIntervalMs: number;
  private metricsInterval?: NodeJS.Timeout;
  private cacheProviders: Map<string, CacheProvider<unknown>> = new Map();
  
  constructor(
    logger: ILogger,
    analyticsCollector: AnalyticsCollector,
    metricsIntervalMs: number = 300000  // 5 minutes
  ) {
    this.logger = logger;
    this.analyticsCollector = analyticsCollector;
    this.metricsIntervalMs = metricsIntervalMs;
    
    // Set up periodic metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.metricsIntervalMs);
  }
  
  /**
   * Registers a cache provider for metrics collection
   * @param name Unique name for the cache provider
   * @param provider The cache provider instance
   */
  public registerCacheProvider<T>(name: string, provider: CacheProvider<T>): void {
    this.cacheProviders.set(name, provider);
  }
  
  /**
   * Records API call metrics
   * @param endpoint API endpoint
   * @param startTime Start time in milliseconds
   * @param status Success or error status
   * @param userId Optional user ID
   * @param queryParams Optional query parameters
   * @param cacheHit Whether the result was from cache
   * @param provider API provider (e.g., 'OpenMeteo')
   */
  public recordApiCall(
    endpoint: string,
    startTime: number,
    status: string,
    userId?: string,
    queryParams?: Record<string, string>,
    cacheHit?: boolean,
    provider?: string,
    errorMessage?: string
  ): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const data: IAnalyticsData = {
      timestamp: new Date(),
      endpoint,
      responseTime,
      status,
      userId,
      queryParams,
      cacheHit,
      provider,
      errorMessage
    };
    
    this.analyticsCollector.recordApiCall(data);
    
    // Log slow responses
    if (responseTime > 1000) {
      this.logger.warn(
        `Slow API call to ${endpoint}: ${responseTime}ms`,
        { endpoint, responseTime, provider }
      );
    }
  }
  
  /**
   * Collects metrics from all registered providers
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Collect cache metrics from all providers
      for (const [name, provider] of this.cacheProviders.entries()) {
        try {
          const stats = await provider.getStats();
          this.analyticsCollector.recordCacheStats(
            stats.hits,
            stats.misses,
            name
          );
        } catch (error) {
          this.logger.error(
            `Error collecting metrics from ${name}: ${(error as Error).message}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error collecting metrics: ${(error as Error).message}`
      );
    }
  }
  
  /**
   * Generates a metrics report for a specific time period
   * @param startDate Start date
   * @param endDate End date (defaults to now)
   */
  public async generateMetricsReport(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<AggregatedMetricsReport> {
    const reports: DailyMetricsReport[] = [];
    const currentDate = new Date(startDate);
    
    // Generate daily reports for each day in the range
    while (currentDate <= endDate) {
      const report = await this.analyticsCollector.generateDailyReport(
        new Date(currentDate)
      );
      reports.push(report);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Aggregate metrics across all days
    const aggregatedReport = this.aggregateReports(reports);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dailyReports: reports,
      aggregated: aggregatedReport
    };
  }
  
  /**
   * Aggregates multiple daily reports into a single report
   * @param reports Daily reports to aggregate
   */
  private aggregateReports(reports: DailyMetricsReport[]): DailyMetricsReport {
    if (reports.length === 0) {
      return { 
        error: 'No reports to aggregate',
        totalCalls: 0,
        successCalls: 0,
        errorCalls: 0,
        errorRate: '0.0000',
        averageResponseTime: 0,
        endpointCounts: {},
        cacheStats: {
          hits: 0,
          misses: 0,
          hitRatio: '0.00'
        },
        hourlyActivity: {},
        providerCounts: {}
      };
    }
    
    // Initialize aggregated values
    let totalCalls = 0;
    let successCalls = 0;
    let errorCalls = 0;
    let totalResponseTime = 0;
    const endpointCounts: Record<string, number> = {};
    let cacheHits = 0;
    let cacheMisses = 0;
    const hourlyActivity: Record<number, number> = {};
    const providerCounts: Record<string, number> = {};
    
    // Aggregate values from each report
    reports.forEach(report => {
      if (report.error) return;
      
      totalCalls += report.totalCalls || 0;
      successCalls += report.successCalls || 0;
      errorCalls += report.errorCalls || 0;
      totalResponseTime += report.averageResponseTime * (report.totalCalls || 0);
      
      // Aggregate endpoint counts
      if (report.endpointCounts) {
        Object.entries(report.endpointCounts).forEach(([endpoint, count]) => {
          endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + (count as number);
        });
      }
      
      // Aggregate cache stats
      if (report.cacheStats) {
        cacheHits += report.cacheStats.hits || 0;
        cacheMisses += report.cacheStats.misses || 0;
      }
      
      // Aggregate hourly activity
    //   if (report.hourlyActivity) {
    //     Object.entries(report.hourlyActivity).forEach((entry) => {
    //       const hour: string = entry[0]; // This is explicitly a string
    //       const count = entry[1]; // This is the number value
    //       hourlyActivity[hour] = (hourlyActivity[hour] || 0) + count;
    //     });
    //   }
      
      // Aggregate provider counts
      if (report.providerCounts) {
        Object.entries(report.providerCounts).forEach(([provider, count]) => {
          providerCounts[provider] = (providerCounts[provider] || 0) + (count as number);
        });
      }
    });
    
    // Calculate aggregated metrics
    const averageResponseTime = totalCalls > 0 ? totalResponseTime / totalCalls : 0;
    
    return {
      totalCalls,
      successCalls,
      errorCalls,
      errorRate: totalCalls > 0 ? (errorCalls / totalCalls).toFixed(4) : '0.0000',
      averageResponseTime,
      endpointCounts,
      cacheStats: {
        hits: cacheHits,
        misses: cacheMisses,
        hitRatio: (cacheHits + cacheMisses) > 0
          ? (cacheHits / (cacheHits + cacheMisses)).toFixed(2)
          : '0.00'
      },
      hourlyActivity,
      providerCounts
    };
  }
  
  /**
   * Cleans up resources when the service is no longer needed
   */
  public cleanup(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}