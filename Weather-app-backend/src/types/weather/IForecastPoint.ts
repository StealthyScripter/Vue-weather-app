// types/weather/IForecastPoint.ts
import { IDetailedWeatherData } from './IDetailedWeatherData';

export interface IForecastPoint {
  time: Date;
  weather: IDetailedWeatherData;
}