// types/weather/IBasicWeatherData.ts
import { IWeatherCondition } from './IWeatherCondition';

export interface IBasicWeatherData {
  temperature: number;
  condition: IWeatherCondition;
}