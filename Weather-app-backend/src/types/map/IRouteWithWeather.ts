// types/map/IRouteWithWeather.ts
import { IRoute } from './IRoute';
import { IWeatherPoint } from './IWeatherPoint';

export interface IElevationPoint {
  distance: number;
  elevation: number;
}

export interface IRouteWithWeather {
  route: IRoute;
  eta: Date;
  weatherPoints: IWeatherPoint[];
  elevationProfile?: IElevationPoint[];
}