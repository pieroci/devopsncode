import { apiClient } from '@/services/apiClient';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Only send username, email, and password to the API (confirmPassword is client-side only)
      const { username, email, password } = data;
      const response = await apiClient.post(API_ENDPOINTS.auth.register, { username, email, password });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<Omit<AuthResponse, 'user'>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.auth.refresh, { refreshToken });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Token refresh failed');
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } catch (error) {
      // Logout should not throw - just log the error
      console.error('Logout error:', error);
    }
  },

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.auth.me);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch user data');
    }
  },
};
