import apiService from './apiService';

export interface LocationResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  formatted_address: string;
}

export interface LocationSearchResponse {
  results: LocationResult[];
  total: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  components: {
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface CurrentLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  city: string;
  state: string;
  country: string;
  timestamp: string;
}

class LocationService {
  async getCurrentLocation(lat?: number, lng?: number): Promise<CurrentLocationResult> {
    try {
      const params = new URLSearchParams();
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lng !== undefined) params.append('lng', lng.toString());
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiService.get<CurrentLocationResult>(`/api/location/current${query}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get current location');
    } catch (error) {
      console.error('Get current location error:', error);
      throw error;
    }
  }

  async searchLocations(query: string, limit: number = 5): Promise<LocationSearchResponse> {
    try {
      const response = await apiService.get<LocationSearchResponse>(
        `/api/location/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to search locations');
    } catch (error) {
      console.error('Search locations error:', error);
      throw error;
    }
  }

  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const response = await apiService.get<GeocodeResult>(
        `/api/location/geocode?address=${encodeURIComponent(address)}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to geocode address');
    } catch (error) {
      console.error('Geocode address error:', error);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    try {
      const response = await apiService.get<GeocodeResult>(
        `/api/location/reverse?lat=${lat}&lng=${lng}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to reverse geocode');
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  }

  // Helper method to get device location (requires expo-location)
  async getDeviceLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      // This would require expo-location package
      // For now, return a default location
      return {
        latitude: 35.3021,
        longitude: -81.3400,
      };
    } catch (error) {
      console.error('Get device location error:', error);
      // Return default location if failed
      return {
        latitude: 35.3021,
        longitude: -81.3400,
      };
    }
  }
}

export default new LocationService();