import apiService from './apiService';

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface CurrentWeather {
  location: WeatherLocation;
  current: {
    temperature: number;
    feels_like: number;
    condition: string;
    condition_text: string;
    humidity: number;
    wind_speed: number;
    wind_direction: string;
    pressure: string;
    visibility: number;
    uv_index: number;
    air_quality: {
      index: number;
      category: string;
      description: string;
    };
  };
  timestamp: string;
}

export interface ForecastDay {
  date: string;
  day: string;
  high_temp: number;
  low_temp: number;
  condition: string;
  condition_text: string;
  precipitation_chance: number;
  wind_speed: number;
  humidity: number;
}

export interface Forecast {
  location: WeatherLocation;
  forecast: ForecastDay[];
}

export interface HourlyForecast {
  location: WeatherLocation;
  hourly: {
    datetime: string;
    temperature: number;
    condition: string;
    condition_text: string;
    precipitation_chance: number;
    wind_speed: number;
    humidity: number;
  }[];
}

export interface WeatherAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  start_time: string;
  end_time: string;
  areas: string[];
}

export interface WeatherAlerts {
  alerts: WeatherAlert[];
  count: number;
}

export interface AirQuality {
  location: WeatherLocation;
  air_quality: {
    index: number;
    category: string;
    description: string;
    components: {
      pm25: number;
      pm10: number;
      o3: number;
      no2: number;
      so2: number;
      co: number;
    };
    timestamp: string;
  };
}

class WeatherService {
  async getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
    try {
      const response = await apiService.get<CurrentWeather>(
        `/api/weather/current?lat=${lat}&lng=${lng}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get current weather');
    } catch (error) {
      console.error('Get current weather error:', error);
      throw error;
    }
  }

  async getForecast(lat: number, lng: number, days: number = 5): Promise<Forecast> {
    try {
      const response = await apiService.get<Forecast>(
        `/api/weather/forecast?lat=${lat}&lng=${lng}&days=${days}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get forecast');
    } catch (error) {
      console.error('Get forecast error:', error);
      throw error;
    }
  }

  async getHourlyForecast(lat: number, lng: number, hours: number = 24): Promise<HourlyForecast> {
    try {
      const response = await apiService.get<HourlyForecast>(
        `/api/weather/hourly?lat=${lat}&lng=${lng}&hours=${hours}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get hourly forecast');
    } catch (error) {
      console.error('Get hourly forecast error:', error);
      throw error;
    }
  }

  async getWeatherAlerts(lat: number, lng: number): Promise<WeatherAlerts> {
    try {
      const response = await apiService.get<WeatherAlerts>(
        `/api/weather/alerts?lat=${lat}&lng=${lng}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get weather alerts');
    } catch (error) {
      console.error('Get weather alerts error:', error);
      throw error;
    }
  }

  async getAirQuality(lat: number, lng: number): Promise<AirQuality> {
    try {
      const response = await apiService.get<AirQuality>(
        `/api/weather/air-quality?lat=${lat}&lng=${lng}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get air quality');
    } catch (error) {
      console.error('Get air quality error:', error);
      throw error;
    }
  }
}

export default new WeatherService();