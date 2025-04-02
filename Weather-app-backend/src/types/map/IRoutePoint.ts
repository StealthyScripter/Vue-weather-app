// types/map/IRoutePoint.ts
export interface IRoutePoint {
    coordinates: [number, number]; // [longitude, latitude]
    distance: number;
    progress: number;
    elevation?: number;
    instruction?: string;
    turnInfo?: string;
  }