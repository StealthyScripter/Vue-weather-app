// src/services/analyticsService.ts
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import config from '../config';

interface AnalyticsEvent {
  timestamp: Date;
  endpoint: string;
  method: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  responseTime: number;
  statusCode: number;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private readonly analyticsDir: string;
  private readonly maxEventsInMemory: number;
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor(
    analyticsDir: string = config.analyticsDirectory,
    maxEventsInMemory: number = 1000,
    flushIntervalMs: number = 60000 // 1 minute
  ) {
    this.analyticsDir = analyticsDir;
    this.maxEventsInMemory = maxEventsInMemory;
    
    // Ensure directory exists
    if (!fs.existsSync(this.analyticsDir)) {
      fs.mkdirSync(this.analyticsDir, { recursive: true });
    }
    
    // Set up flush interval - currently has a default value
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, flushIntervalMs);
    
    logger.info(`Analytics service initialized (flush interval: ${flushIntervalMs}ms)`);
  }
  
  /**
   * Record an API request
   * @param event Analytics event data
   */
  public record(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date()
    };
    
    this.events.push(analyticsEvent);
    
    // Flush if we've reached the limit
    if (this.events.length >= this.maxEventsInMemory) {
      this.flushEvents();
    }
  }
  
  /**
   * Flush events to disk
   */
  private flushEvents(): void {
    if (this.events.length === 0) {
      return;
    }

    const eventsToFlush = [...this.events];
    this.events = [];  // Clear the events array temporarily.
    
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const filePath = path.join(this.analyticsDir, `analytics-${dateStr}.json`);
      
      // Read existing data if file exists
      let existingData: AnalyticsEvent[] = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        existingData = JSON.parse(fileContent);
      }
      
      // Combine existing data with new events
      const combinedData = [...existingData, ...eventsToFlush];
      
      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
      logger.debug(`Flushed ${eventsToFlush.length} analytics events to ${filePath}`);
      
      // Clear in-memory events
      this.events = [];
    } catch (error) {
      logger.error(`Error flushing analytics events: ${error instanceof Error ? error.message : String(error)}`);
      // Push the failed flush events back into memory.
      this.events = [...eventsToFlush, ...this.events];
    }
  }
  
  /**
   * Generate a daily report
   * @param date Date to generate report for (defaults to yesterday)
   */
  public async generateDailyReport(date?: Date): Promise<any> {
    // Flush any pending events
    await this.flushEvents();
    
    const reportDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = reportDate.toISOString().split('T')[0];
    const filePath = path.join(this.analyticsDir, `analytics-${dateStr}.json`);
    
    if (!fs.existsSync(filePath)) {
      return {
        date: dateStr,
        events: 0,
        message: 'No analytics data available for this date'
      };
    }
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const events: AnalyticsEvent[] = JSON.parse(fileContent);
      
      // Calculate statistics
      const totalRequests = events.length;
      const endpoints = this.countByProperty(events, 'endpoint');
      const methods = this.countByProperty(events, 'method');
      const statusCodes = this.countByProperty(events, 'statusCode');
      const userAgents = this.countByProperty(events, 'userAgent');
      
      // Calculate average response time
      const totalResponseTime = events.reduce((total, event) => total + event.responseTime, 0);
      const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
      
      // Count by hour
      const hourCounts = this.countByHour(events);
      
      return {
        date: dateStr,
        totalRequests,
        endpoints,
        methods,
        statusCodes,
        avgResponseTime,
        hourCounts,
        topUserAgents: this.getTopItems(userAgents, 5)
      };
    } catch (error) {
      logger.error(`Error generating analytics report: ${error instanceof Error ? error.message : String(error)}`);
      return {
        date: dateStr,
        error: 'Error generating report'
      };
    }
  }
  
  /**
   * Count events by a property
   * @param events Events to count
   * @param property Property to count by
   */
  private countByProperty<T extends keyof AnalyticsEvent>(
    events: AnalyticsEvent[],
    property: T
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    
    events.forEach(event => {
      const value = String(event[property] || 'undefined');
      counts[value] = (counts[value] || 0) + 1;
    });
    
    return counts;
  }
  
  /**
   * Count events by hour
   * @param events Events to count
   */
  private countByHour(events: AnalyticsEvent[]): Record<string, number> {
    const hourCounts: Record<string, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      const hourKey = hour.toString().padStart(2, '0');
      hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
    });
    
    return hourCounts;
  }
  
  /**
   * Get top items from a count record
   * @param counts Count record
   * @param limit Maximum number of items to return
   */
  private getTopItems(counts: Record<string, number>, limit: number): Array<{ name: string; count: number }> {
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    this.flushEvents();
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();