// types/analytics/IAnalyticsData.ts
export interface IAnalyticsData {
    timestamp: Date;
    endpoint: string;
    responseTime: number;  // milliseconds
    status: string;        // 'success' or 'error'
    userId?: string;
    queryParams?: Record<string, string>;
    errorMessage?: string;
    cacheHit?: boolean;
    provider?: string;    // e.g. 'OpenMeteo', 'GraphHopper'
  }