// types/map/IRoute.ts
import { IRouteGeometry } from './IRouteGeometry';
import { ILocation } from '../base/ILocation';

export interface IRouteInstruction {
  distance: number;
  text: string;
  time: number;
  sign: number; // direction sign (e.g., 0=straight, 1=right, etc.)
}

export interface IRoute {
  distance: number; // in meters
  duration: number; // in seconds
  ascent?: number; // elevation gain in meters
  descent?: number; // elevation loss in meters
  geometry: IRouteGeometry;
  startLocation: ILocation;
  endLocation: ILocation;
  instructions?: IRouteInstruction[];
}