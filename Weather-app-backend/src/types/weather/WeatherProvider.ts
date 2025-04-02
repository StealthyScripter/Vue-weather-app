// types/weather/WeatherProvider.ts
import { ApiClient } from '../api/ApiClient';
import { ICoordinates } from '../base/ICoordinates';
import { IDetailedWeatherData } from './IDetailedWeatherData';
import { IForecastPoint } from './IForecastPoint';

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