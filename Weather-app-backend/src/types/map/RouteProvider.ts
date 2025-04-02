// types/map/RouteProvider.ts
import { ApiClient } from '../api/ApiClient';
import { ICoordinates } from '../base/ICoordinates';
import { IRoute } from './IRoute';

// Create a type for route options to replace the 'any' type
export interface RouteOptions {
    profile?: string;        // Routing profile (e.g., 'car', 'bike', 'foot')
    alternatives?: boolean;  // Whether to return alternative routes
    steps?: boolean;         // Whether to include instructions
    geometries?: string;     // Format of the returned geometry
    overview?: string;       // Type of overview geometry
    annotations?: string[];  // Annotations to include
    language?: string;       // Language for instructions
    waypoints?: ICoordinates[]; // Intermediate points
    [key: string]: unknown;  // Allow for additional properties
  }

export abstract class RouteProvider extends ApiClient {
  /**
   * Calculates a route between start and end locations
   * @param start Starting location (coordinates or name)
   * @param end Ending location (coordinates or name)
   * @param options Additional routing options
   */
 public abstract getRoute(
    start: ICoordinates | string, 
    end: ICoordinates | string, 
    options?: RouteOptions
  ): Promise<IRoute>;
}