/**
 * Utility functions for mapping and navigation
 */

/**
 * Calculate estimated time of arrival based on distance and average speed
 * @param distance Distance in kilometers
 * @param avgSpeed Average speed in km/h
 * @returns Estimated time of arrival in minutes
 */
export const calculateETA = (distance: number, avgSpeed: number): number => {
  return (distance / avgSpeed) * 60; // Convert to minutes
};

/**
 * Format coordinates for display
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Get weather forecast for specific time based on hourly data
 * @param hourlyData Array of hourly weather forecasts
 * @param targetTime Target time for forecast
 * @returns Weather forecast for the closest hour
 */
export const getWeatherAtTime = (
  hourlyData: any[],
  targetTime: Date
): any | null => {
  if (!hourlyData || hourlyData.length === 0) return null;

  const targetHour = targetTime.getHours();

  // Find the forecast closest to the target time
  return hourlyData.find((data, index) => {
    if (typeof data.time === 'string' && data.time === 'Now') {
      return targetHour === new Date().getHours();
    }

    // Handle time formats like "10 AM" or "2 PM"
    if (typeof data.time === 'string') {
      const timeParts = data.time.split(' ');
      let hour = parseInt(timeParts[0]);

      if (timeParts[1] === 'PM' && hour < 12) {
        hour += 12;
      } else if (timeParts[1] === 'AM' && hour === 12) {
        hour = 0;
      }

      return hour === targetHour;
    }

    return false;
  }) || hourlyData[0]; // Default to first item if no match
};

export default {
  calculateETA,
  formatCoordinates,
  calculateDistance,
  getWeatherAtTime
};
