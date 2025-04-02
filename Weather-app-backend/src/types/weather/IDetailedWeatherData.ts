// types/weather/IDetailedWeatherData.ts
import { IBasicWeatherData } from './IBasicWeatherData';

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