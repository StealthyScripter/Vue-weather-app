// types/base/IBoundingBox.ts
import { ICoordinates } from './ICoordinates.js';

export interface IBoundingBox {
  southwest: ICoordinates;
  northeast: ICoordinates;
}