// types/weather/IWeatherResponse.ts
import { ILocation } from '../base/ILocation';
import { IDetailedWeatherData } from './IDetailedWeatherData';
import { IForecastPoint } from './IForecastPoint';
import { IWeatherCondition } from './IWeatherCondition';

export interface IDailyForecast {
  date: Date;
  min: number;
  max: number;
  condition: IWeatherCondition;
}

export interface IWeatherResponse {
  location: ILocation;
  current: IDetailedWeatherData;
  hourly: IForecastPoint[];
  daily: IDailyForecast[];
}