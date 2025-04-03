// src/providers/map/graphHopperProvider.ts
import { ApiClient, QueryParams } from '../../utils/apiClient';
import { IRateLimiter, FixedWindowRateLimiter } from '../../utils/rateLimiter';
import { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import config from '../../config';
import { ICoordinates } from '../weather/openMeteoProvider';

// Define interfaces for route data
export interface IRouteGeometry {
  type: string; // typically "LineString" for GeoJSON
  coordinates: [number, number][]; // array of [longitude, latitude] pairs
}

export interface IRouteInstruction {
  distance: number;
  text: string;
  time: number;
  sign: number; // direction sign (e.g., 0=straight, 1=right, etc.)
}

export interface ILocation {
  name: string;
  longitude: number;
  latitude: number;
  placeType?: string;
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

// Define interface for GraphHopper API response
interface GraphHopperResponse {
  paths: {
    distance: number;
    time: number;
    ascend?: number;
    descend?: number;
    points: {
      type: string;
      coordinates: [number, number][];
    };
    instructions?: {
      distance: number;
      text: string;
      time: number;
      sign: number;
    }[];
  }[];
}

// Define interface for routing options
export interface RouteOptions {
  profile?: string;        // Routing profile (e.g., 'car', 'bike', 'foot')
  alternatives?: boolean;  // Whether to return alternative routes
  steps?: boolean;         // Whether to include instructions
  elevation?: boolean;     // Whether to include elevation data
  optimize?: string;       // What to optimize for (e.g., 'time', 'distance')
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

export class GraphHopperRouteProvider extends RouteProvider {
  private apiKey: string;
  
  constructor(
    baseUrl: string = config.graphHopperBaseUrl,
    apiKey: string = config.graphHopperApiKey,
    rateLimiter: IRateLimiter = new FixedWindowRateLimiter(300, 60000), // 300 requests per minute
    customLogger?: ILogger,
    timeout: number = 30000
  ) {
    super(baseUrl, rateLimiter, customLogger, timeout);
    this.apiKey = apiKey;
    this.logger.info('GraphHopper route provider initialized');
  }
  
  /**
   * Gets the coordinates for a location
   * @param location Location coordinates or location name
   */
  private async getCoordinates(location: ICoordinates | string): Promise<ICoordinates> {
    if (typeof location === 'string') {
      // For simplicity, we'll assume location is in "lat,lon" format
      // In a real implementation, you would use a geocoding service here
      const [latStr, lonStr] = location.split(',');
      return {
        latitude: parseFloat(latStr.trim()),
        longitude: parseFloat(lonStr.trim())
      };
    }
    
    return location;
  }
  
  /**
   * Calculates a route between start and end locations
   * @param start Starting location (coordinates or name)
   * @param end Ending location (coordinates or name)
   * @param options Additional routing options
   */
  public async getRoute(
    start: ICoordinates | string, 
    end: ICoordinates | string, 
    options: RouteOptions = {}
  ): Promise<IRoute> {
    const startCoords = await this.getCoordinates(start);
    const endCoords = await this.getCoordinates(end);
    
    // Construct the points parameter for the API request
    const points = [
      `${startCoords.latitude},${startCoords.longitude}`,
      `${endCoords.latitude},${endCoords.longitude}`
    ];
    
    const params: QueryParams = {
      vehicle: options.profile || 'car',
      points: points.join('|'),
      instructions: options.steps !== false,
      elevation: !!options.elevation,
      optimize: options.optimize || 'time',
      alternative_routes: options.alternatives ? `{"max_paths":3}` : undefined,
      key: this.apiKey
    };
    
    try {
      const response = await this.get<GraphHopperResponse>('/route', params);
      
      if (!response.paths || response.paths.length === 0) {
        throw new Error('No route found');
      }
      
      const path = response.paths[0];
      
      // Convert the response to our internal format
      const route: IRoute = {
        distance: path.distance,
        duration: path.time / 1000, // Convert milliseconds to seconds
        ascent: path.ascend,
        descent: path.descend,
        geometry: {
          type: path.points.type,
          coordinates: path.points.coordinates
        },
        startLocation: {
          name: typeof start === 'string' ? start : `${startCoords.latitude},${startCoords.longitude}`,
          latitude: startCoords.latitude,
          longitude: startCoords.longitude
        },
        endLocation: {
          name: typeof end === 'string' ? end : `${endCoords.latitude},${endCoords.longitude}`,
          latitude: endCoords.latitude,
          longitude: endCoords.longitude
        },
        instructions: path.instructions
      };
      
      return route;
    } catch (error) {
      this.logger.error(`Error calculating route: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}