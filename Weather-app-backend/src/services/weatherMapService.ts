// src/services/weatherMapService.ts
import { OpenMeteoProvider, ICoordinates, IDetailedWeatherData, IForecastPoint } from '../providers/weather/openMeteoProvider';
import { GraphHopperRouteProvider, IRoute, RouteOptions, ILocation } from '../providers/map/graphHopperprovider'
import { OSMGeocodingProvider } from '../providers/geocoding/osmProvider';
import { ILogger } from '../utils/logger';
import logger from '../utils/logger';
import config from '../config';

// Interface for a point along a route with weather data
export interface IWeatherPoint {
  coordinates: [number, number]; // [longitude, latitude]
  time: Date;
  formattedTime: string;
  progress: number; // 0-100%
  weather: IDetailedWeatherData;
  locationName: string;
  elevation?: number;
}

// Interface for elevation data along a route
export interface IElevationPoint {
  distance: number;
  elevation: number;
}

// Interface for a route with weather data
export interface IRouteWithWeather {
  route: IRoute;
  eta: Date;
  weatherPoints: IWeatherPoint[];
  elevationProfile?: IElevationPoint[];
}

export class WeatherMapService {
  private weatherProvider: OpenMeteoProvider;
  private routeProvider: GraphHopperRouteProvider;
  private geocodingProvider: OSMGeocodingProvider;
  private logger: ILogger;
  
  constructor(
    weatherProvider?: OpenMeteoProvider,
    routeProvider?: GraphHopperRouteProvider,
    geocodingProvider?: OSMGeocodingProvider,
    customLogger?: ILogger
  ) {
    this.weatherProvider = weatherProvider || new OpenMeteoProvider();
    this.routeProvider = routeProvider || new GraphHopperRouteProvider();
    this.geocodingProvider = geocodingProvider || new OSMGeocodingProvider();
    this.logger = customLogger || logger;
    
    this.logger.info('Weather map service initialized');
  }
  
  /**
   * Gets the current weather for a location
   * @param location Location name or coordinates
   */
  public async getWeatherForLocation(location: string | ICoordinates): Promise<IDetailedWeatherData> {
    try {
      return await this.weatherProvider.getCurrentWeather(location);
    } catch (error) {
      this.logger.error(`Error getting weather for location: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Gets the weather forecast for a location
   * @param location Location name or coordinates
   * @param days Number of days to forecast
   */
  public async getWeatherForecast(location: string | ICoordinates, days: number = 7): Promise<IForecastPoint[]> {
    try {
      return await this.weatherProvider.getForecast(location, days);
    } catch (error) {
      this.logger.error(`Error getting weather forecast: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Gets location details from a place name
   * @param placeName Place name to geocode
   */
  public async getLocationDetails(placeName: string): Promise<ILocation> {
    try {
      return await this.geocodingProvider.geocode(placeName);
    } catch (error) {
      this.logger.error(`Error geocoding place: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Gets nearby places around a location
   * @param location Center location
   * @param radius Search radius in meters
   * @param type Type of places to search for
   */
  public async getNearbyPlaces(location: string | ICoordinates, radius: number = 1000, type?: string): Promise<ILocation[]> {
    try {
      let coordinates: ICoordinates;
      
      if (typeof location === 'string') {
        const locationDetails = await this.geocodingProvider.geocode(location);
        coordinates = {
          latitude: locationDetails.latitude,
          longitude: locationDetails.longitude
        };
      } else {
        coordinates = location;
      }
      
      return await this.geocodingProvider.getNearbyPlaces(coordinates, radius, type);
    } catch (error) {
      this.logger.error(`Error getting nearby places: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Calculates a route with weather data between two locations
   * @param start Starting location
   * @param end Ending location
   * @param options Routing options
   */
  public async getRouteWithWeather(
    start: string | ICoordinates,
    end: string | ICoordinates,
    options: RouteOptions = {}
  ): Promise<IRouteWithWeather> {
    try {
      // Get the route
      const route = await this.routeProvider.getRoute(start, end, {
        ...options,
        elevation: true, // Request elevation data
        steps: true // Request detailed instructions
      });
      
      // Calculate ETA
      const now = new Date();
      const eta = new Date(now.getTime() + route.duration * 1000);
      
      // Calculate weather points along the route
      const weatherPoints = await this.calculateRouteWeatherPoints(route, eta);
      
      // Extract elevation profile if available
      const elevationProfile = this.extractElevationProfile(route);
      
      return {
        route,
        eta,
        weatherPoints,
        elevationProfile
      };
    } catch (error) {
      this.logger.error(`Error calculating route with weather: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Calculates weather points along a route
   * @param route The route
   * @param eta Estimated arrival time
   */
  private async calculateRouteWeatherPoints(route: IRoute, eta: Date): Promise<IWeatherPoint[]> {
    // Determine number of points based on route distance
    const distanceKm = route.distance / 1000;
    let numPoints: number;
    
    if (distanceKm < 50) {
      numPoints = 3; // Short route
    } else if (distanceKm < 200) {
      numPoints = Math.floor(4 + (distanceKm - 50) / 50); // Medium route
    } else {
      numPoints = Math.min(8, 6 + Math.floor((distanceKm - 200) / 100)); // Long route
    }
    
    // Make sure we have at least start, middle, and end points
    numPoints = Math.max(3, numPoints);
    
    const weatherPoints: IWeatherPoint[] = [];
    const now = new Date();
    const startTime = now.getTime();
    const etaTime = eta.getTime();
    const totalDuration = etaTime - startTime;
    
    // Get start weather
    const startWeather = await this.weatherProvider.getCurrentWeather({
      latitude: route.startLocation.latitude,
      longitude: route.startLocation.longitude
    });
    
    weatherPoints.push({
      coordinates: [route.startLocation.longitude, route.startLocation.latitude],
      time: now,
      formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      progress: 0,
      weather: startWeather,
      locationName: 'Starting point',
      elevation: route.geometry.coordinates[0][2 | 0] // Z coordinate if available
    });
    
    // Get weather at regular intervals
    for (let i = 1; i < numPoints - 1; i++) {
      const progress = i / (numPoints - 1);
      const pointTime = new Date(startTime + totalDuration * progress);
      
      // Get position along route
      let routeProgress = progress;
      if (distanceKm > 100) {
        // Bias the distribution for longer routes
        routeProgress = Math.pow(progress, 0.8);
      }
      
      const routeIndex = Math.min(
        Math.floor(routeProgress * route.geometry.coordinates.length),
        route.geometry.coordinates.length - 1
      );
      
      const coordinate = route.geometry.coordinates[routeIndex];
      
      // Get weather forecast for this time and location
      const forecast = await this.weatherProvider.getForecast({
        latitude: coordinate[1],
        longitude: coordinate[0]
      });
      
      // Find the forecast point closest to the target time
      const closestForecast = this.findClosestForecast(forecast, pointTime);
      
      if (closestForecast) {
        // Determine location name based on progress
        let locationName;
        if (progress < 0.25) {
          locationName = `Just after start (~${Math.round(progress * 100)}%)`;
        } else if (progress > 0.75) {
          locationName = `Near destination (~${Math.round(progress * 100)}%)`;
        } else {
          locationName = `En route (~${Math.round(progress * 100)}%)`;
        }
        
        weatherPoints.push({
          coordinates: [coordinate[0], coordinate[1]],
          time: pointTime,
          formattedTime: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          progress: Math.round(progress * 100),
          weather: closestForecast.weather,
          locationName,
          elevation: coordinate[2 | 0] // Z coordinate if available
        });
      }
    }
    
    // Get end weather
    const endWeather = await this.weatherProvider.getForecast({
      latitude: route.endLocation.latitude,
      longitude: route.endLocation.longitude
    });
    
    const closestEndForecast = this.findClosestForecast(endWeather, eta);
    
    if (closestEndForecast) {
      weatherPoints.push({
        coordinates: [route.endLocation.longitude, route.endLocation.latitude],
        time: eta,
        formattedTime: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        progress: 100,
        weather: closestEndForecast.weather,
        locationName: 'Destination',
        elevation: route.geometry.coordinates[route.geometry.coordinates.length - 1][2 | 0] // Z coordinate if available
      });
    }
    
    return weatherPoints;
  }
  
  /**
   * Finds the forecast point closest to the target time
   * @param forecast Forecast points
   * @param targetTime Target time
   */
  private findClosestForecast(forecast: IForecastPoint[], targetTime: Date): IForecastPoint | null {
    if (!forecast || forecast.length === 0) {
      return null;
    }
    
    let closestPoint = forecast[0];
    let minTimeDiff = Math.abs(targetTime.getTime() - forecast[0].time.getTime());
    
    for (let i = 1; i < forecast.length; i++) {
      const timeDiff = Math.abs(targetTime.getTime() - forecast[i].time.getTime());
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestPoint = forecast[i];
      }
    }
    
    return closestPoint;
  }
  
  /**
   * Extracts elevation profile from a route
   * @param route The route
   */
  private extractElevationProfile(route: IRoute): IElevationPoint[] | undefined {
    // Check if route has elevation data
    if (!route.geometry.coordinates[0][2 | 0]) {
      return undefined;
    }
    
    const profile: IElevationPoint[] = [];
    let cumulativeDistance = 0;
    
    for (let i = 0; i < route.geometry.coordinates.length; i++) {
      const coord = route.geometry.coordinates[i];
      
      // Calculate distance from start
      if (i > 0) {
        const prevCoord = route.geometry.coordinates[i - 1];
        const segmentDistance = this.haversineDistance(
          prevCoord[1], prevCoord[0],
          coord[1], coord[0]
        );
        cumulativeDistance += segmentDistance;
      }
      
      profile.push({
        distance: cumulativeDistance,
        elevation: coord[2 | 0]
      });
    }
    
    return profile;
  }
  
  /**
   * Calculates distance between two points using Haversine formula
   * @param lat1 Latitude of point 1
   * @param lon1 Longitude of point 1
   * @param lat2 Latitude of point 2
   * @param lon2 Longitude of point 2
   * @returns Distance in kilometers
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }
}