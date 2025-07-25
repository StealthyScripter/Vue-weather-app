// Common API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  message?: string;
}

// Common coordinate interface
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Weather condition types
export type WeatherCondition = 
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'light_rain'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'foggy';

// Traffic condition types
export type TrafficCondition = 'light' | 'moderate' | 'heavy';

// Weather severity types
export type WeatherSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';

// Route type preferences
export type RouteType = 'fastest' | 'shortest';

// Temperature units
export type TemperatureUnit = 'fahrenheit' | 'celsius';

// Distance units
export type DistanceUnit = 'miles' | 'kilometers';

// Time format
export type TimeFormat = '12h' | '24h';

// Theme options
export type Theme = 'light' | 'dark' | 'auto';

// Navigation params for routes
export interface RouteParams {
  predictionData?: string;
}

// Map icon types
export interface WeatherIconMap {
  [key: string]: string;
}

// Error types
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}