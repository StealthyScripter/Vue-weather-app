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
    // Validate input before sending
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    console.log('Attempting login for:', credentials.email);
    const response = await apiService.post<AuthResponse>('/api/auth/login', credentials);
    console.log('Login response status:', response.success);
    console.log('Login response:', response);
    
    // Handle different response scenarios
    if (response.success && response.data) {
      try {
        // Save tokens to storage with error handling
        await apiService.saveTokens(
          response.data.tokens.access_token,
          response.data.tokens.refresh_token
        );
        console.log('Tokens saved successfully');
        
        return response.data;
      } catch (tokenError) {
        console.error('Failed to save tokens:', tokenError);
        // Still return the auth data even if token saving fails
        return response.data;
      }
    }
    
    // Handle API error responses
    if (response.error) {
      const errorMessage = response.error.message || 'Login failed';
      console.error('Login API error:', response.error);
      throw new Error(errorMessage);
    }
    
    // Fallback error
    throw new Error('Login failed - unexpected response format');
    
  } catch (error) {
    console.error('Login error details:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Login request timed out. Please check your connection.');
      } else if (error.message.includes('Network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message.includes('500')) {
        throw new Error('Server error. Please try again later.');
      }
      throw error;
    }
    
    throw new Error('An unexpected error occurred during login');
  }
}

async signup(userData: SignupData): Promise<AuthResponse> {
  try {
    // Validate input before sending
    if (!userData.email || !userData.password || !userData.full_name) {
      throw new Error('All fields are required');
    }
    
    if (userData.password !== userData.confirm_password) {
      throw new Error('Passwords do not match');
    }

    console.log('Attempting signup for:', userData.email);
    const response = await apiService.post<AuthResponse>('/api/auth/signup', userData);
    console.log('Signup response status:', response.success);
    console.log('Signup response:', response);
    
    // Handle different response scenarios
    if (response.success && response.data) {
      try {
        // Save tokens to storage with error handling
        await apiService.saveTokens(
          response.data.tokens.access_token,
          response.data.tokens.refresh_token
        );
        console.log('Tokens saved successfully after signup');
        
        return response.data;
      } catch (tokenError) {
        console.error('Failed to save tokens after signup:', tokenError);
        // Still return the auth data even if token saving fails
        return response.data;
      }
    }
    
    // Handle API error responses
    if (response.error) {
      const errorMessage = response.error.message || 'Signup failed';
      console.error('Signup API error:', response.error);
      
      // Handle specific signup errors
      if (response.error.code === 'VALIDATION_ERROR' && response.error.details) {
        const validationErrors = response.error.details
          .map(detail => detail.message)
          .join(', ');
        throw new Error(validationErrors);
      }
      
      throw new Error(errorMessage);
    }
    
    // Fallback error
    throw new Error('Signup failed - unexpected response format');
    
    } catch (error) {
      console.error('Signup error details:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Signup request timed out. Please check your connection.');
        } else if (error.message.includes('Network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else if (error.message.includes('429')) {
          throw new Error('Too many signup attempts. Please wait and try again.');
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred during signup');
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