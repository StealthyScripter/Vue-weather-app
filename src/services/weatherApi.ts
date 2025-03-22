import axios from 'axios'

const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export interface WeatherApiParams {
  latitude: number;
  longitude: number;
  current?: string[];
  hourly?: string[];
  daily?: string[];
  timezone?: string;
  temperature_unit?: 'celsius' | 'fahrenheit';
}

export interface CurrentWeather {
  temperature_2m: number;
  weathercode: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  time: string;
  relative_humidity_2m?: number;
  pressure_msl?: number;
  apparent_temperature?: number;
  [key: string]: number | string | undefined;
}

export interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units?: {
    [key: string]: string;
  };
  current?: CurrentWeather;
  hourly_units?: {
    [key: string]: string;
  };
  hourly?: {
    [key: string]: (string | number)[] | undefined;
  };
  daily_units?: {
    [key: string]: string;
  };
  daily?: {
    [key: string]: (string | number)[] | undefined;
  };
}

export interface ProcessedCurrentWeather {
  temperature: number;
  condition: string;
  feelsLike: number;
  high: number;
  low: number;
}

export interface WeatherDetails {
  wind: {
    speed: number;
    direction: string;
  };
  humidity: number;
  uvIndex: number;
  pressure: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  description: string;
}

export const getWeatherData = async (params: WeatherApiParams): Promise<WeatherApiResponse> => {
  try {
    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

export const getWeatherByCity = async (city: string, unit: string | 'celsius' | 'fahrenheit' = 'celsius'): Promise<WeatherApiResponse> => {
  try {
    // In a real app, you would use a geocoding API to convert city name to coordinates
    // For this example, we'll use hardcoded coordinates for common cities
    const coordinates = getCityCoordinates(city);

    return await getWeatherData({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'weathercode',
        'wind_speed_10m',
        'wind_direction_10m',
        'pressure_msl',
        'apparent_temperature'
      ],
      hourly: [
        'temperature_2m',
        'weathercode',
        'precipitation_probability'
      ],
      daily: [
        'weathercode',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'uv_index_max'
      ],
      timezone: 'auto',
      temperature_unit: unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'
    });
  } catch (error) {
    console.error('Error fetching weather data for city:', error);
    throw error;
  }
}

export const processCurrentWeather = (data: WeatherApiResponse): ProcessedCurrentWeather => {
  if (!data.current || !data.daily) {
    throw new Error('Invalid weather data');
  }

  return {
    temperature: data.current.temperature_2m,
    condition: getWeatherCodeDescription(data.current.weathercode),
    feelsLike: data.current.apparent_temperature || data.current.temperature_2m,
    high: data.daily.temperature_2m_max ? (data.daily.temperature_2m_max as number[])[0] : 0,
    low: data.daily.temperature_2m_min ? (data.daily.temperature_2m_min as number[])[0] : 0
  };
};

export const processWeatherDetails = (data: WeatherApiResponse): WeatherDetails => {
  if (!data.current || !data.daily) {
    throw new Error('Invalid weather data');
  }

  const windDirection = getWindDirection(data.current.wind_direction_10m);
  const uvIndex = data.daily.uv_index_max ? (data.daily.uv_index_max as number[])[0] : 0;

  return {
    wind: {
      speed: data.current.wind_speed_10m,
      direction: windDirection
    },
    humidity: data.current.relative_humidity_2m || 0,
    uvIndex: uvIndex,
    pressure: data.current.pressure_msl || 0
  };
}

export const processHourlyForecast = (data: WeatherApiResponse): HourlyForecast[] => {
  if (!data.hourly) {
    return [];
  }

  const times = data.hourly.time as string[];
  const temps = data.hourly.temperature_2m as number[];
  const weatherCodes = data.hourly.weathercode as number[];

  // Only take the next 24 hours
  const hourlyData: HourlyForecast[] = [];
  const now = new Date();

  for (let i = 0; i < 24 && i < times.length; i++) {
    const time = new Date(times[i]);
    let displayTime = 'Now';

    if (i > 0) {
      displayTime = time.getHours() + ':00';
    }

    hourlyData.push({
      time: displayTime,
      temp: temps[i],
      icon: getWeatherIconForCode(weatherCodes[i])
    });
  }

  return hourlyData;
}

export const processDailyForecast = (data: WeatherApiResponse): DailyForecast[] => {
  if (!data.daily) {
    return [];
  }

  const time = data.daily.time as string[];
  const weatherCode = data.daily.weathercode as number[];
  const tempMax = data.daily.temperature_2m_max as number[];
  const tempMin = data.daily.temperature_2m_min as number[];
  const precipSum = data.daily.precipitation_sum as number[];

  return time.map((date, index) => {
    return {
      date,
      weatherCode: weatherCode[index],
      tempMax: tempMax[index],
      tempMin: tempMin[index],
      precipitationSum: precipSum[index],
      description: getWeatherCodeDescription(weatherCode[index])
    };
  });
}

// Helper function to get wind direction from degrees
export const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Helper function to get city coordinates
export const getCityCoordinates = (city: string): { latitude: number; longitude: number } => {
  // Normalize the city name for case-insensitive matching
  const normalizedCity = city.toLowerCase().trim();

  const cities: { [key: string]: { latitude: number; longitude: number } } = {
    'raleigh': { latitude: 35.7796, longitude: -78.6382 },
    'new york': { latitude: 40.7128, longitude: -74.0060 },
    'los angeles': { latitude: 34.0522, longitude: -118.2437 },
    'chicago': { latitude: 41.8781, longitude: -87.6298 },
    'london': { latitude: 51.5074, longitude: -0.1278 },
    'paris': { latitude: 48.8566, longitude: 2.3522 },
    'tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'raleigh, nc': { latitude: 35.7796, longitude: -78.6382 },
    'raleigh, nc, usa': { latitude: 35.7796, longitude: -78.6382 },
    'new york, ny, usa': { latitude: 40.7128, longitude: -74.0060 },
    'los angeles, ca, usa': { latitude: 34.0522, longitude: -118.2437 },
    'chicago, il, usa': { latitude: 41.8781, longitude: -87.6298 },
    'london, uk': { latitude: 51.5074, longitude: -0.1278 },
    'paris, france': { latitude: 48.8566, longitude: 2.3522 },
    'tokyo, japan': { latitude: 35.6762, longitude: 139.6503 },
    'sydney, australia': { latitude: -33.8688, longitude: 151.2093 }
  };

  return cities[normalizedCity] || cities['raleigh']; // Default to Raleigh if city not found
}

export const getWeatherCodeDescription = (code: number): string => {
  // WMO Weather interpretation codes (WW)
  const weatherCodes: {[key: number]: string} = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Slight Snow Fall',
    73: 'Moderate Snow Fall',
    75: 'Heavy Snow Fall',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Slight Hail',
    99: 'Thunderstorm with Heavy Hail'
  };
  return weatherCodes[code] || 'Unknown';
}

export const getWeatherIconForCode = (code: number): string => {
  // Map WMO weather codes to simpler icon names for UI display
  if (code === 0) return 'clear';
  if (code === 1) return 'clear';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';

  return 'cloudy'; // Default
}

// Helper function to convert temperature from Celsius to Fahrenheit
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
}

// Helper function to convert temperature from Fahrenheit to Celsius
export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5/9;
}

export default {
  getWeatherData,
  getWeatherByCity,
  getWeatherCodeDescription,
  getWeatherIconForCode,
  processCurrentWeather,
  processWeatherDetails,
  processHourlyForecast,
  processDailyForecast,
  celsiusToFahrenheit,
  fahrenheitToCelsius
}
