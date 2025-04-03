// src/providers/weather/openMeteoProvider.ts
import { ApiClient, QueryParams } from '../../utils/apiClient';
import { IRateLimiter, FixedWindowRateLimiter } from '../../utils/rateLimiter';
import { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import config from '../../config';

// Define interfaces for geographical coordinates
export interface ICoordinates {
  latitude: number;
  longitude: number;
}

// Define interfaces for weather condition
export interface IWeatherCondition {
  code: number;
  text: string;
  iconCode: string;
}

// Define interface for basic weather data
export interface IBasicWeatherData {
  temperature: number;
  condition: IWeatherCondition;
}

// Define interface for detailed weather data
export interface IDetailedWeatherData extends IBasicWeatherData {
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  pressure?: number;
  precipitation?: number;
  uvIndex?: number;
  visibility?: number;
  cloudCover?: number;
  dewPoint?: number;
  isDay?: boolean;
}

// Define interface for weather forecast point
export interface IForecastPoint {
  time: Date;
  weather: IDetailedWeatherData;
}

// Map WMO weather codes to condition text and icons
const wmoCodeMap: Record<number, { text: string, icon: string }> = {
  0: { text: 'Clear sky', icon: '01d' },
  1: { text: 'Mainly clear', icon: '01d' },
  2: { text: 'Partly cloudy', icon: '02d' },
  3: { text: 'Overcast', icon: '04d' },
  45: { text: 'Fog', icon: '50d' },
  48: { text: 'Depositing rime fog', icon: '50d' },
  51: { text: 'Light drizzle', icon: '09d' },
  53: { text: 'Moderate drizzle', icon: '09d' },
  55: { text: 'Dense drizzle', icon: '09d' },
  56: { text: 'Light freezing drizzle', icon: '09d' },
  57: { text: 'Dense freezing drizzle', icon: '09d' },
  61: { text: 'Slight rain', icon: '10d' },
  63: { text: 'Moderate rain', icon: '10d' },
  65: { text: 'Heavy rain', icon: '10d' },
  66: { text: 'Light freezing rain', icon: '13d' },
  67: { text: 'Heavy freezing rain', icon: '13d' },
  71: { text: 'Slight snow fall', icon: '13d' },
  73: { text: 'Moderate snow fall', icon: '13d' },
  75: { text: 'Heavy snow fall', icon: '13d' },
  77: { text: 'Snow grains', icon: '13d' },
  80: { text: 'Slight rain showers', icon: '09d' },
  81: { text: 'Moderate rain showers', icon: '09d' },
  82: { text: 'Violent rain showers', icon: '09d' },
  85: { text: 'Slight snow showers', icon: '13d' },
  86: { text: 'Heavy snow showers', icon: '13d' },
  95: { text: 'Thunderstorm', icon: '11d' },
  96: { text: 'Thunderstorm with slight hail', icon: '11d' },
  99: { text: 'Thunderstorm with heavy hail', icon: '11d' },
};

// Define interface for Open-Meteo API response
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
    apparent_temperature: number[];
    precipitation: number[];
    weathercode: number[];
    surface_pressure: number[];
    cloudcover: number[];
    visibility: number[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    uv_index: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    uv_index_max: number[];
  };
}

export abstract class WeatherProvider extends ApiClient {
  /**
   * Retrieves current weather data for the specified location
   * @param location Location coordinates or location name
   */
  public abstract getCurrentWeather(location: ICoordinates | string): Promise<IDetailedWeatherData>;
  
  /**
   * Retrieves weather forecast for the specified location and number of days
   * @param location Location coordinates or location name
   * @param days Number of days to forecast
   */
  public abstract getForecast(location: ICoordinates | string, days: number): Promise<IForecastPoint[]>;
}

export class OpenMeteoProvider extends WeatherProvider {
  constructor(
    baseUrl: string = config.openMeteoBaseUrl,
    rateLimiter: IRateLimiter = new FixedWindowRateLimiter(60, 60000), // 60 requests per minute
    customLogger: ILogger = logger
  ) {
    super(baseUrl, rateLimiter, customLogger);
    this.logger.info('OpenMeteo weather provider initialized');
  }
  
  /**
   * Gets the coordinates for a location
   * @param location Location coordinates or location name
   */
  private async getCoordinates(location: ICoordinates | string): Promise<ICoordinates> {
    if (typeof location === 'string') {
      // For simplicity, we'll assume location is in "lat,lon" format
      // In a real implementation, you would use a geocoding service here
      const [latStr, lonStr] = location.split(',');
      return {
        latitude: parseFloat(latStr.trim()),
        longitude: parseFloat(lonStr.trim())
      };
    }
    
    return location;
  }
  
  /**
   * Maps a WMO weather code to a condition object
   * @param code WMO weather code
   * @param isDay Whether it's daytime (to select correct icon)
   */
  private getWeatherCondition(code: number, isDay: boolean = true): IWeatherCondition {
    const condition = wmoCodeMap[code] || { text: 'Unknown', icon: '03d' };
    // Replace 'd' with 'n' for night icons
    const iconCode = isDay ? condition.icon : condition.icon.replace('d', 'n');
    
    return {
      code,
      text: condition.text,
      iconCode
    };
  }
  
  /**
   * Retrieves current weather data for the specified location
   * @param location Location coordinates or location name
   */
  public async getCurrentWeather(location: ICoordinates | string): Promise<IDetailedWeatherData> {
    const coordinates = await this.getCoordinates(location);
    
    const params: QueryParams = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      current_weather: true,
      hourly: [
        'temperature_2m',
        'relativehumidity_2m',
        'apparent_temperature',
        'precipitation',
        'weathercode',
        'surface_pressure',
        'cloudcover',
        'visibility',
        'windspeed_10m',
        'winddirection_10m',
        'uv_index',
        'is_day'
      ].join(','),
      timeformat: 'iso8601'
    };
    
    const response = await this.get<OpenMeteoResponse>('/forecast', params);
    
    // Get current hour index
    const currentTimeStr = response.current_weather.time;
    const hourlyTimeIndex = response.hourly.time.findIndex(time => time === currentTimeStr);
    
    // Create weather condition
    const isDay = response.current_weather.is_day === 1;
    const condition = this.getWeatherCondition(response.current_weather.weathercode, isDay);
    
    // Get hourly details for the current hour
    const hourlyData = hourlyTimeIndex >= 0 ? {
      humidity: response.hourly.relativehumidity_2m[hourlyTimeIndex],
      feelsLike: response.hourly.apparent_temperature[hourlyTimeIndex],
      precipitation: response.hourly.precipitation[hourlyTimeIndex],
      pressure: response.hourly.surface_pressure[hourlyTimeIndex],
      cloudCover: response.hourly.cloudcover[hourlyTimeIndex],
      visibility: response.hourly.visibility[hourlyTimeIndex],
      uvIndex: response.hourly.uv_index[hourlyTimeIndex],
      isDay: response.hourly.is_day[hourlyTimeIndex] === 1
    } : {};
    
    return {
      temperature: response.current_weather.temperature,
      condition,
      windSpeed: response.current_weather.windspeed,
      windDirection: response.current_weather.winddirection,
      ...hourlyData
    };
  }
  
  /**
   * Retrieves weather forecast for the specified location and number of days
   * @param location Location coordinates or location name
   * @param days Number of days to forecast
   */
  public async getForecast(location: ICoordinates | string, days: number = 7): Promise<IForecastPoint[]> {
    const coordinates = await this.getCoordinates(location);
    
    const params: QueryParams = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      hourly: [
        'temperature_2m',
        'relativehumidity_2m',
        'apparent_temperature',
        'precipitation',
        'weathercode',
        'surface_pressure',
        'cloudcover',
        'visibility',
        'windspeed_10m',
        'winddirection_10m',
        'uv_index',
        'is_day'
      ].join(','),
      forecast_days: days,
      timeformat: 'iso8601'
    };
    
    const response = await this.get<OpenMeteoResponse>('/forecast', params);
    
    // Convert hourly data to forecast points
    const forecastPoints: IForecastPoint[] = response.hourly.time.map((timeStr, index) => {
      const time = new Date(timeStr);
      const isDay = response.hourly.is_day[index] === 1;
      const condition = this.getWeatherCondition(response.hourly.weathercode[index], isDay);
      
      const weather: IDetailedWeatherData = {
        temperature: response.hourly.temperature_2m[index],
        condition,
        feelsLike: response.hourly.apparent_temperature[index],
        humidity: response.hourly.relativehumidity_2m[index],
        precipitation: response.hourly.precipitation[index],
        pressure: response.hourly.surface_pressure[index],
        cloudCover: response.hourly.cloudcover[index],
        visibility: response.hourly.visibility[index],
        windSpeed: response.hourly.windspeed_10m[index],
        windDirection: response.hourly.winddirection_10m[index],
        uvIndex: response.hourly.uv_index[index],
        isDay
      };
      
      return { time, weather };
    });
    
    return forecastPoints;
  }
}