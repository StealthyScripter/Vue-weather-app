import { ApiClient, QueryParams } from '../../utils/apiClient';
import { IRateLimiter, FixedWindowRateLimiter } from '../../utils/rateLimiter';
import { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { ICoordinates } from '../weather/openMeteoProvider';
import { ILocation } from 'providers/map/graphHopperprovider';

// Define interface for OSM Nominatim API response
interface OSMNominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    country: string;
    state?: string;
    city?: string;
    [key: string]: string | undefined;
  };
  boundingbox: string[];
  type: string;
  importance: number;
}

export abstract class GeocodingProvider extends ApiClient {
  /**
   * Converts a place name into geographic coordinates
   * @param placeName Name of the place to geocode
   */
  public abstract geocode(placeName: string): Promise<ILocation>;
  
  /**
   * Converts geographic coordinates into a place name
   * @param coordinates Coordinates to reverse geocode
   */
  public abstract reverseGeocode(coordinates: ICoordinates): Promise<ILocation>;
  
  /**
   * Gets nearby places around the specified coordinates
   * @param coordinates Center coordinates
   * @param radius Search radius in meters
   * @param type Type of places to search for
   */
  public abstract getNearbyPlaces(
    coordinates: ICoordinates, 
    radius?: number, 
    type?: string
  ): Promise<ILocation[]>;
}

export class OSMGeocodingProvider extends GeocodingProvider {
  constructor(
    baseUrl: string = 'https://nominatim.openstreetmap.org',
    rateLimiter: IRateLimiter = new FixedWindowRateLimiter(1, 1000), // 1 request per second as per OSM policy
    customLogger?: ILogger,
    timeout: number = 30000
  ) {
    super(baseUrl, rateLimiter, customLogger, timeout);
    
    // Set a custom user agent as per OSM Nominatim requirements
    this.axiosInstance.defaults.headers.common['User-Agent'] = 'WeatherMapApp/1.0';
    
    this.logger.info('OSM geocoding provider initialized');
  }
  
  /**
   * Converts a place name into geographic coordinates
   * @param placeName Name of the place to geocode
   */
  public async geocode(placeName: string): Promise<ILocation> {
    const params: QueryParams = {
      q: placeName,
      format: 'json',
      limit: 1,
      addressdetails: 1
    };
    
    try {
      const response = await this.get<OSMNominatimResponse[]>('/search', params);
      
      if (!response || response.length === 0) {
        throw new Error(`Location "${placeName}" not found`);
      }
      
      const result = response[0];
      
      return {
        name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        placeType: result.type
      };
    } catch (error) {
      this.logger.error(`Error geocoding "${placeName}": ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Converts geographic coordinates into a place name
   * @param coordinates Coordinates to reverse geocode
   */
  public async reverseGeocode(coordinates: ICoordinates): Promise<ILocation> {
    const params: QueryParams = {
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      format: 'json',
      addressdetails: 1
    };
    
    try {
      const response = await this.get<OSMNominatimResponse>('/reverse', params);
      
      if (!response) {
        throw new Error(`No location found at coordinates (${coordinates.latitude}, ${coordinates.longitude})`);
      }
      
      return {
        name: response.display_name,
        latitude: parseFloat(response.lat),
        longitude: parseFloat(response.lon),
        placeType: response.type
      };
    } catch (error) {
      this.logger.error(`Error reverse geocoding (${coordinates.latitude}, ${coordinates.longitude}): ${
        error instanceof Error ? error.message : String(error)
      }`);
      throw error;
    }
  }
  
  /**
   * Gets nearby places around the specified coordinates
   * @param coordinates Center coordinates
   * @param radius Search radius in meters
   * @param type Type of places to search for
   */
  public async getNearbyPlaces(
    coordinates: ICoordinates, 
    radius: number = 1000, 
    type: string = 'place'
  ): Promise<ILocation[]> {
    // Convert radius to bounding box
    // This is a simplified approach - for more accuracy, 
    // a proper calculation taking into account the Earth's curvature would be needed
    const latDiff = radius / 111000; // Approximate degrees per meter
    const lonDiff = radius / (111000 * Math.cos(coordinates.latitude * Math.PI / 180));
    
    const bbox = `${coordinates.longitude - lonDiff},${coordinates.latitude - latDiff},${coordinates.longitude + lonDiff},${coordinates.latitude + latDiff}`;
    
    const params: QueryParams = {
      format: 'json',
      bounded: 1,
      limit: 50,
      addressdetails: 1,
      viewbox: bbox
    };
    
    // Add type filter if specified
    if (type) {
      params.amenity = type;
    }
    
    try {
      const response = await this.get<OSMNominatimResponse[]>('/search', params);
      
      if (!response || response.length === 0) {
        return [];
      }
      
      // Convert the response to our internal format
      return response.map(place => ({
        name: place.display_name,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        placeType: place.type
      }));
    } catch (error) {
      this.logger.error(`Error finding nearby places: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}