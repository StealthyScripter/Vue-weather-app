/**
 * Utility functions for location handling
 */

interface CityCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Get coordinates for a city
 * @param city City name
 * @returns Latitude and longitude
 */
export const getCityCoordinates = (city: string): CityCoordinates => {
  const cities: { [key: string]: CityCoordinates } = {
    'raleigh': { latitude: 35.7796, longitude: -78.6382 },
    'new york': { latitude: 40.7128, longitude: -74.0060 },
    'los angeles': { latitude: 34.0522, longitude: -118.2437 },
    'chicago': { latitude: 41.8781, longitude: -87.6298 },
    'london': { latitude: 51.5074, longitude: -0.1278 },
    'paris': { latitude: 48.8566, longitude: 2.3522 },
    'tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'sydney': { latitude: -33.8688, longitude: 151.2093 },
    'berlin': { latitude: 52.5200, longitude: 13.4050 },
    'rome': { latitude: 41.9028, longitude: 12.4964 },
  };

  const normalizedCity = city.toLowerCase();
  return cities[normalizedCity] || cities['raleigh']; // Default to Raleigh if city not found
}

/**
 * Format location display
 * @param city City name
 * @returns Formatted location string (e.g., "Raleigh, NC, USA")
 */
export const formatLocationDisplay = (city: string): string => {
  // In a real app, this would use a geocoding API to get full location details
  // For this example, we'll use a simplified version
  const locationMap: { [key: string]: string } = {
    'raleigh': 'Raleigh, NC, USA',
    'new york': 'New York, NY, USA',
    'los angeles': 'Los Angeles, CA, USA',
    'chicago': 'Chicago, IL, USA',
    'london': 'London, UK',
    'paris': 'Paris, France',
    'tokyo': 'Tokyo, Japan',
    'sydney': 'Sydney, Australia',
    'berlin': 'Berlin, Germany',
    'rome': 'Rome, Italy',
  };

  const normalizedCity = city.toLowerCase();
  return locationMap[normalizedCity] || `${city}`;
}

/**
 * Get wind direction description from degrees
 * @param degrees Wind direction in degrees
 * @returns Cardinal direction (N, NE, E, etc.)
 */
export const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export default {
  getCityCoordinates,
  formatLocationDisplay,
  getWindDirection
}
