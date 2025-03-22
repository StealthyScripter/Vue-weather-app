/**
 * Service for geocoding and reverse geocoding using Mapbox API
 */
import { useConfigStore } from "@/stores/config";

interface GeocodingResult {
  latitude: number;
  longitude: number;
  placeName: string;
}

/**
 * Convert place name to coordinates using Mapbox Geocoding API
 * @param placeName Name of the place to geocode
 * @param mapboxToken Mapbox API token
 * @returns Promise with geocoding result
 */
export const geocodePlace = async (
  placeName: string): Promise<GeocodingResult> => {
  try {
    // First try the predefined locations from our utility
    const predefinedCoords = getPredefinedCoordinates(placeName);
    if (predefinedCoords) {
      return {
        latitude: predefinedCoords.latitude,
        longitude: predefinedCoords.longitude,
        placeName: formatPlaceName(placeName)
      };
    }

    // If not found in predefined list, use Mapbox geocoding API
    const encodedPlace = encodeURIComponent(placeName);
    const configStore = useConfigStore();
    const mapboxToken = configStore.mapboxToken;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedPlace}.json?access_token=${mapboxToken}&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        longitude: feature.center[0],
        latitude: feature.center[1],
        placeName: feature.place_name
      };
    } else {
      // If no results found, return default location (Raleigh, NC)
      return {
        latitude: 35.7796,
        longitude: -78.6382,
        placeName: 'Raleigh, NC, USA'
      };
    }
  } catch (error) {
    console.error('Error geocoding place:', error);
    // Return default location on error
    return {
      latitude: 35.7796,
      longitude: -78.6382,
      placeName: 'Raleigh, NC, USA'
    };
  }
};

/**
 * Convert coordinates to place name using Mapbox Reverse Geocoding API
 * @param latitude Latitude
 * @param longitude Longitude
 * @param mapboxToken Mapbox API token
 * @returns Promise with place name
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const configStore = useConfigStore();
    const mapboxToken = configStore.mapboxToken;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    } else {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Get predefined coordinates for common cities
 * @param place Place name to look up
 * @returns Coordinates or null if not found
 */
const getPredefinedCoordinates = (place: string): { latitude: number; longitude: number } | null => {
  const normalizedPlace = place.toLowerCase().trim();

  const cities: { [key: string]: { latitude: number; longitude: number } } = {
    'raleigh': { latitude: 35.7796, longitude: -78.6382 },
    'new york': { latitude: 40.7128, longitude: -74.0060 },
    'los angeles': { latitude: 34.0522, longitude: -118.2437 },
    'chicago': { latitude: 41.8781, longitude: -87.6298 },
    'london': { latitude: 51.5074, longitude: -0.1278 },
    'paris': { latitude: 48.8566, longitude: 2.3522 },
    'tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'raleigh, nc': { latitude: 35.7796, longitude: -78.6382 },
    'raleigh, nc, usa': { latitude: 35.7796, longitude: -78.6382 },
    'new york, ny': { latitude: 40.7128, longitude: -74.0060 },
    'new york, ny, usa': { latitude: 40.7128, longitude: -74.0060 },
    'los angeles, ca': { latitude: 34.0522, longitude: -118.2437 },
    'los angeles, ca, usa': { latitude: 34.0522, longitude: -118.2437 },
    'chicago, il': { latitude: 41.8781, longitude: -87.6298 },
    'chicago, il, usa': { latitude: 41.8781, longitude: -87.6298 },
    'london, uk': { latitude: 51.5074, longitude: -0.1278 },
    'paris, france': { latitude: 48.8566, longitude: 2.3522 },
    'tokyo, japan': { latitude: 35.6762, longitude: 139.6503 },
    'sydney, australia': { latitude: -33.8688, longitude: 151.2093 },
    'berlin, germany': { latitude: 52.5200, longitude: 13.4050 },
    'rome, italy': { latitude: 41.9028, longitude: 12.4964 },
    'madrid, spain': { latitude: 40.4168, longitude: -3.7038 },
    'beijing, china': { latitude: 39.9042, longitude: 116.4074 },
    'moscow, russia': { latitude: 55.7558, longitude: 37.6173 },
    'dubai, uae': { latitude: 25.2048, longitude: 55.2708 },
    'toronto, canada': { latitude: 43.6532, longitude: -79.3832 },
    'miami, fl': { latitude: 25.7617, longitude: -80.1918 },
    'miami, fl, usa': { latitude: 25.7617, longitude: -80.1918 },
    'san francisco, ca': { latitude: 37.7749, longitude: -122.4194 },
    'san francisco, ca, usa': { latitude: 37.7749, longitude: -122.4194 },
    'seattle, wa': { latitude: 47.6062, longitude: -122.3321 },
    'seattle, wa, usa': { latitude: 47.6062, longitude: -122.3321 }
  };

  // Check if the normalized place exists in our predefined cities
  return cities[normalizedPlace] || null;
};

/**
 * Format place name for display
 * @param place Raw place name
 * @returns Formatted place name
 */
const formatPlaceName = (place: string): string => {
  // Format city names with proper capitalization
  const locationMap: { [key: string]: string } = {
    'raleigh': 'Raleigh, NC, USA',
    'new york': 'New York, NY, USA',
    'los angeles': 'Los Angeles, CA, USA',
    'chicago': 'Chicago, IL, USA',
    'london': 'London, UK',
    'paris': 'Paris, France',
    'tokyo': 'Tokyo, Japan',
    'sydney': 'Sydney, Australia'
  };

  const normalizedPlace = place.toLowerCase().trim();
  return locationMap[normalizedPlace] || place;
};

export default {
  geocodePlace,
  reverseGeocode
};
