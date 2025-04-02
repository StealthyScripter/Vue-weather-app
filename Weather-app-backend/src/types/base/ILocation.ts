// types/base/ILocation.ts
import { ICoordinates } from './ICoordinates';

export interface ILocation extends ICoordinates {
  name: string;
  placeType?: string;
  osmId?: string;
  country?: string;
  city?: string;
}