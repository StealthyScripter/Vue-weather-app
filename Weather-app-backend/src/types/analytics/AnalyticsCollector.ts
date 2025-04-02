import { IAnalyticsData } from './IAnalyticsData';
import { ILogger } from '../logging/ILogger';
import { DailyMetricsReport } from './MetricsService';
import fs from 'fs';
import path from 'path';

export class AnalyticsCollector {
  private logger: ILogger;
  private analyticsDirectory: string;
  private inMemoryData: IAnalyticsData[] = [];
  private readonly maxInMemoryRecords: number;
  private readonly flushIntervalMs: number;
  private flushInterval?: NodeJS.Timeout;
  
  constructor(
    logger: ILogger,
    analyticsDirectory: string,
    maxInMemoryRecords: number = 1000,
    flushIntervalMs: number = 60000  // 1 minute
  ) {
    this.logger = logger;
    this.analyticsDirectory = analyticsDirectory;
    this.maxInMemoryRecords = maxInMemoryRecords;
    this.flushIntervalMs = flushIntervalMs;
    
    // Ensure analytics directory exists
    if (!fs.existsSync(this.analyticsDirectory)) {
      fs.mkdirSync(this.analyticsDirectory, { recursive: true });
    }
    
    // Set up periodic flush
    this.flushInterval = setInterval(() => {
      this.flushAnalytics();
    }, this.flushIntervalMs);
  }
  
  /**
   * Records an API call for analytics
   * @param data Analytics data to record
   */
  public recordApiCall(data: IAnalyticsData): void {
    this.inMemoryData.push(data);
    
    // Flush if we've reached the limit
    if (this.inMemoryData.length >= this.maxInMemoryRecords) {
      this.flushAnalytics();
    }
  }
  
  /**
   * Records cache statistics
   * @param hits Number of cache hits
   * @param misses Number of cache misses
   */
  public recordCacheStats(hits: number, misses: number, provider: string): void {
    const timestamp = new Date();
    const data: IAnalyticsData = {
      timestamp,
      endpoint: 'cache-stats',
      responseTime: 0,
      status: 'success',
      provider,
      queryParams: {
        hits: hits.toString(),
        misses: misses.toString(),
        hitRatio: (hits / (hits + misses || 1)).toFixed(2)
      }
    };
    
    this.inMemoryData.push(data);
  }
  
  /**
   * Generates a daily analytics report
   * @param date Date to generate report for (defaults to yesterday)
   */
  public async generateDailyReport(date?: Date): Promise<DailyMetricsReport>{
    const reportDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = reportDate.toISOString().split('T')[0];
    
    try {
      // Flush any pending data
      await this.flushAnalytics();
      
      // Read analytics for the specified date
      const filePath = path.join(
        this.analyticsDirectory,
        `analytics-${dateStr}.json`
      );
      
      if (!fs.existsSync(filePath)) {
        return { 
            error: 'No analytics data available for the specified date',
            date: dateStr,
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
      
      const analyticsJson = fs.readFileSync(filePath, 'utf8');
      const analytics: IAnalyticsData[] = JSON.parse(analyticsJson);
      
      // Calculate report metrics
      const totalCalls = analytics.length;
      const successCalls = analytics.filter(a => a.status === 'success').length;
      const errorCalls = totalCalls - successCalls;
      
      const averageResponseTime = analytics.reduce(
        (sum, a) => sum + a.responseTime, 
        0
      ) / totalCalls;
      
      const endpointCounts: Record<string, number> = {};
      analytics.forEach(a => {
        endpointCounts[a.endpoint] = (endpointCounts[a.endpoint] || 0) + 1;
      });
      
      const cacheHits = analytics.filter(a => a.cacheHit).length;
      const cacheMisses = analytics.filter(
        a => a.cacheHit === false
      ).length;
      
      // Group by hour
      const hourlyActivity: Record<number, number> = {};
      analytics.forEach(a => {
        const hour = new Date(a.timestamp).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });
      
      // Group by provider
      const providerCounts: Record<string, number> = {};
      analytics.forEach(a => {
        if (a.provider) {
          providerCounts[a.provider] = (providerCounts[a.provider] || 0) + 1;
        }
      });
      
      return {
        date: dateStr,
        totalCalls,
        successCalls,
        errorCalls,
        errorRate: (errorCalls / totalCalls).toFixed(4),
        averageResponseTime,
        endpointCounts,
        cacheStats: {
          hits: cacheHits,
          misses: cacheMisses,
          hitRatio: (cacheHits / (cacheHits + cacheMisses || 1)).toFixed(2)
        },
        hourlyActivity,
        providerCounts
      };
    } catch (error) {
      this.logger.error(
        `Error generating analytics report: ${(error as Error).message}`
      );
      return { 
        error: 'Error generating analytics report',
        date: dateStr,
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
  }
  
  /**
   * Flushes in-memory analytics data to disk
   */
  private async flushAnalytics(): Promise<void> {
    if (this.inMemoryData.length === 0) {
      return;
    }
    
    try {
      // Group analytics by date
      const analyticsMap: Record<string, IAnalyticsData[]> = {};
      
      this.inMemoryData.forEach(data => {
        const dateStr = data.timestamp.toISOString().split('T')[0];
        if (!analyticsMap[dateStr]) {
          analyticsMap[dateStr] = [];
        }
        analyticsMap[dateStr].push(data);
      });
      
      // Save each date's analytics to its own file
      for (const dateStr in analyticsMap) {
        const filePath = path.join(
          this.analyticsDirectory,
          `analytics-${dateStr}.json`
        );
        
        let existingData: IAnalyticsData[] = [];
        
        // Read existing data if file exists
        if (fs.existsSync(filePath)) {
          try {
            const existingJson = fs.readFileSync(filePath, 'utf8');
            existingData = JSON.parse(existingJson);
          } catch (error) {
            this.logger.error(
              `Error reading existing analytics file: ${(error as Error).message}`
            );
          }
        }
        
        // Combine existing and new data
        const combinedData = [...existingData, ...analyticsMap[dateStr]];
        
        // Write combined data back to file
        fs.writeFileSync(
          filePath,
          JSON.stringify(combinedData, null, 2)
        );
      }
      
      // Clear in-memory data
      this.inMemoryData = [];
    } catch (error) {
      this.logger.error(
        `Error flushing analytics: ${(error as Error).message}`
      );
    }
  }
  
  /**
   * Cleans up resources when the collector is no longer needed
   */
  public cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush any remaining data
    this.flushAnalytics();
  }
}