import apiService from './apiService';

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.success && response.data) {
        // Save tokens to storage
        await apiService.saveTokens(
          response.data.tokens.access_token,
          response.data.tokens.refresh_token
        );
        
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/api/auth/signup', userData);
      
      if (response.success && response.data) {
        // Save tokens to storage
        await apiService.saveTokens(
          response.data.tokens.access_token,
          response.data.tokens.refresh_token
        );
        
        return response.data;
      }
      
      throw new Error(response.error?.message || 'Signup failed');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await apiService.getRefreshToken();
      
      if (refreshToken) {
        // Call logout API
        await apiService.post('/api/auth/logout', {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local tokens
      await apiService.clearTokens();
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      return await apiService.refreshAccessToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getAccessToken();
    return !!token;
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiService.post('/api/auth/forgot-password', { email });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      const response = await apiService.post('/api/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
}

export default new AuthService();