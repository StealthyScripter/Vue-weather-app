// types/map/GeocodingProvider.ts
import { ApiClient } from '../api/ApiClient';
import { ICoordinates } from '../base/ICoordinates';
import { ILocation } from '../base/ILocation';

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