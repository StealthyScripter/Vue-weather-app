export { default as apiService } from './apiService';
export { default as authService } from './authService';
export { default as weatherService } from './weatherService';
export { default as routeService } from './routeService';
export { default as userService } from './userService';
export { default as locationService } from './locationService';

// Export types
export type { User, LoginCredentials, SignupData, AuthResponse } from './authService';
export type { 
  CurrentWeather, 
  Forecast, 
  ForecastDay, 
  HourlyForecast, 
  WeatherAlert, 
  WeatherAlerts, 
  AirQuality,
  WeatherLocation 
} from './weatherService';
export type { 
  Route, 
  RouteLocation, 
  RouteWaypoint, 
  RoutePreferences, 
  RouteDirections, 
  TrafficConditions, 
  TrafficSegment,
  RouteWeatherPrediction, 
  WeatherPoint, 
  WeatherSummary 
} from './routeService';
export type { 
  UserProfile, 
  UserPreferences, 
  FavoriteLocation, 
  RouteHistory, 
  PaginatedResponse 
} from './userService';
export type { 
  LocationResult, 
  LocationSearchResponse, 
  GeocodeResult, 
  CurrentLocationResult 
} from './locationService';

// Export common types
export * from '../types';