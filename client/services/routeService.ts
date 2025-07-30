import apiService from './apiService';

export interface RouteLocation {
  latitude: number;
  longitude: number;
}

export interface RouteWaypoint {
  location: RouteLocation;
  city: string;
  eta: string;
  distance_from_start: number;
  sequence: number;
}

export interface Route {
  route_id: string;
  total_distance: number;
  total_duration: string;
  total_duration_seconds: number;
  waypoints: RouteWaypoint[];
  polyline: string;
}

export interface RoutePreferences {
  avoid_tolls?: boolean;
  avoid_highways?: boolean;
  route_type?: 'fastest' | 'shortest';
}

export interface RouteDirection {
  step: number;
  instruction: string;
  distance: string;
  duration: string;
  location: RouteLocation;
}

export interface RouteDirections {
  route_id: string;
  directions: RouteDirection[];
}

export interface TrafficSegment {
  segment_id: string;
  start_location: RouteLocation;
  end_location: RouteLocation;
  distance: string;
  normal_duration: string;
  current_duration: string;
  traffic_condition: 'light' | 'moderate' | 'heavy';
  delay_minutes: number;
}

export interface TrafficConditions {
  route_id: string;
  traffic_summary: {
    overall_condition: 'light' | 'moderate' | 'heavy';
    estimated_delay: string;
    last_updated: string;
  };
  segments: TrafficSegment[];
}

export interface WeatherPoint {
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
  time: string;
  distance_from_start: number;
  weather: {
    temperature: number;
    condition: string;
    condition_text: string;
    icon: string;
    precipitation_chance: number;
    wind_speed: number;
    wind_direction: string;
    humidity: number;
    visibility: number;
  };
}

export interface WeatherSummary {
  overall_condition: 'clear' | 'variable' | 'deteriorating' | 'severe';
  rain_expected: boolean;
  snow_expected: boolean;
  thunderstorm_expected: boolean;
  max_precipitation_chance: number;
  adverse_weather_location: string | null;
  adverse_weather_time: string | null;
  recommendations: string[];
}

export interface RouteWeatherPrediction {
  prediction_id: string;
  route: {
    route_id: string;
    total_distance: number;
    total_duration: string;
    departure_time: string;
    arrival_time: string;
  };
  weather_points: WeatherPoint[];
  weather_summary: WeatherSummary;
  created_at: string;
}

export interface SavedPrediction {
  saved_prediction_id: string;
  prediction_id: string;
  name: string;
  user_id: number;
  notifications: Record<string, any>;
  created_at: string;
}

class RouteService {
  async planRoute(
    origin: RouteLocation,
    destination: RouteLocation,
    departureTime?: string,
    preferences?: RoutePreferences
  ): Promise<Route> {
    try {
      const response = await apiService.post<Route>('/api/routes/plan', {
        origin,
        destination,
        departure_time: departureTime || new Date().toISOString(),
        preferences: preferences || {},
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to plan route');
    } catch (error) {
      console.error('Plan route error:', error);
      throw error;
    }
  }

  async getDirections(routeId: string): Promise<RouteDirections> {
    try {
      const response = await apiService.get<RouteDirections>(
        `/api/routes/directions?route_id=${routeId}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get directions');
    } catch (error) {
      console.error('Get directions error:', error);
      throw error;
    }
  }

  async optimizeForWeather(
    routeId: string,
    optimizationCriteria?: Record<string, any>
  ): Promise<any> {
    try {
      const response = await apiService.post('/api/routes/optimize', {
        route_id: routeId,
        optimization_criteria: optimizationCriteria || {},
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to optimize route');
    } catch (error) {
      console.error('Optimize route error:', error);
      throw error;
    }
  }

  async getTrafficConditions(routeId: string): Promise<TrafficConditions> {
    try {
      const response = await apiService.get<TrafficConditions>(
        `/api/routes/traffic?route_id=${routeId}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get traffic conditions');
    } catch (error) {
      console.error('Get traffic conditions error:', error);
      throw error;
    }
  }

  async predictWeatherAlongRoute(
    origin: RouteLocation,
    destination: RouteLocation,
    departureTime?: string,
    preferences?: RoutePreferences
  ): Promise<RouteWeatherPrediction> {
    try {
      const response = await apiService.post<RouteWeatherPrediction>('/api/route-weather/predict', {
        origin,
        destination,
        departure_time: departureTime,
        preferences: preferences || {},
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to predict weather along route');
    } catch (error) {
      console.error('Predict route weather error:', error);
      throw error;
    }
  }

  async savePrediction(
    predictionId: string,
    name: string,
    notifications?: Record<string, any>
  ): Promise<SavedPrediction> {
    try {
      const response = await apiService.post<SavedPrediction>('/api/route-weather/save', {
        prediction_id: predictionId,
        name,
        notifications: notifications || {},
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to save prediction');
    } catch (error) {
      console.error('Save prediction error:', error);
      throw error;
    }
  }

  async getSavedPrediction(predictionId: string): Promise<any> {
    try {
      const response = await apiService.get(
        `/api/route-weather/saved/${predictionId}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get saved prediction');
    } catch (error) {
      console.error('Get saved prediction error:', error);
      throw error;
    }
  }

  async deleteSavedPrediction(predictionId: string): Promise<void> {
    try {
      const response = await apiService.delete(
        `/api/route-weather/saved/${predictionId}`
      );
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete prediction');
      }
    } catch (error) {
      console.error('Delete prediction error:', error);
      throw error;
    }
  }

  async getUserSavedPredictions(page: number = 1, limit: number = 10): Promise<any> {
    try {
      const response = await apiService.get(
        `/api/route-weather/saved?page=${page}&limit=${limit}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get saved predictions');
    } catch (error) {
      console.error('Get saved predictions error:', error);
      throw error;
    }
  }
}

export default new RouteService();