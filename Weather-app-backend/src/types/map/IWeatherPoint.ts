// types/map/IWeatherPoint.ts
import { IDetailedWeatherData } from '../weather/IDetailedWeatherData';

export interface IWeatherPoint {
  coordinates: [number, number]; // [longitude, latitude]
  time: Date;
  formattedTime: string;
  progress: number; // 0-100%
  weather: IDetailedWeatherData;
  locationName: string;
  elevation?: number;
}