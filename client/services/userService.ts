import apiService from './apiService';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  units: {
    temperature: 'fahrenheit' | 'celsius';
    distance: 'miles' | 'kilometers';
    speed: 'mph' | 'kmh';
    pressure: 'inches' | 'mb';
  };
  display: {
    time_format: '12h' | '24h';
    date_format: string;
    theme: 'light' | 'dark' | 'auto';
  };
  notifications: {
    weather_alerts: boolean;
    severe_weather: boolean;
    traffic_alerts: boolean;
    departure_reminders: boolean;
    push_notifications: boolean;
    email_notifications: boolean;
  };
  route_defaults: {
    route_type: 'fastest' | 'shortest';
    avoid_tolls: boolean;
    avoid_highways: boolean;
    optimize_for_weather: boolean;
  };
}

export interface FavoriteLocation {
  id: number;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface RouteHistory {
  id: number;
  route_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  total_distance: number;
  total_duration: string;
  weather_summary: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  [key: string]: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class UserService {
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiService.get<UserProfile>('/api/user/profile');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get user profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(data: {
    full_name?: string;
    preferences?: Partial<UserPreferences>;
  }): Promise<UserProfile> {
    try {
      const response = await apiService.put<UserProfile>('/api/user/profile', data);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<{
    user_id: number;
    preferences: UserPreferences;
    updated_at: string;
  }> {
    try {
      const response = await apiService.get('/api/user/preferences');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get preferences');
    } catch (error) {
      console.error('Get preferences error:', error);
      throw error;
    }
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<{
    user_id: number;
    preferences: UserPreferences;
    updated_at: string;
  }> {
    try {
      const response = await apiService.put('/api/user/preferences', {
        preferences,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to update preferences');
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }

  async getRouteHistory(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<RouteHistory>> {
    try {
      const response = await apiService.get<PaginatedResponse<RouteHistory>>(
        `/api/user/routes/history?page=${page}&limit=${limit}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get route history');
    } catch (error) {
      console.error('Get route history error:', error);
      throw error;
    }
  }

  async getFavorites(): Promise<{
    favorites: FavoriteLocation[];
    count: number;
  }> {
    try {
      const response = await apiService.get('/api/user/favorites');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to get favorites');
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  }

  async addFavorite(data: {
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
  }): Promise<FavoriteLocation> {
    try {
      const response = await apiService.post<FavoriteLocation>('/api/user/favorites', data);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Failed to add favorite');
    } catch (error) {
      console.error('Add favorite error:', error);
      throw error;
    }
  }

  async deleteFavorite(favoriteId: number): Promise<void> {
    try {
      const response = await apiService.delete(`/api/user/favorites/${favoriteId}`);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete favorite');
      }
    } catch (error) {
      console.error('Delete favorite error:', error);
      throw error;
    }
  }
}

export default new UserService();