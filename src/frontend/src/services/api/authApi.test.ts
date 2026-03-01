import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authApi } from './authApi';
import type { LoginCredentials, RegisterData } from '@/types';

// Mock the apiClient
vi.mock('@/services/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { apiClient } from '@/services/apiClient';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should send login request with credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'jwt-token',
            refreshToken: 'refresh-token',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            user: {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              createdAt: new Date().toISOString(),
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', credentials);
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle login errors', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = {
        response: {
          data: {
            success: false,
            error: 'Invalid credentials',
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(authApi.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await expect(authApi.login(credentials)).rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('should send registration request with user data', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'jwt-token',
            refreshToken: 'refresh-token',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            user: {
              id: '2',
              username: 'newuser',
              email: 'newuser@example.com',
              createdAt: new Date().toISOString(),
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', registerData);
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle validation errors', async () => {
      const registerData: RegisterData = {
        username: 'u',
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
      };

      const mockError = {
        response: {
          data: {
            success: false,
            error: 'Validation failed',
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(authApi.register(registerData)).rejects.toThrow('Validation failed');
    });

    it('should handle duplicate email errors', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const mockError = {
        response: {
          data: {
            success: false,
            error: 'Email already exists',
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(authApi.register(registerData)).rejects.toThrow('Email already exists');
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with refresh token', async () => {
      const refreshToken = 'old-refresh-token';

      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'new-jwt-token',
            refreshToken: 'new-refresh-token',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.refreshToken(refreshToken);

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/refresh', { refreshToken });
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle invalid refresh token', async () => {
      const refreshToken = 'invalid-token';

      const mockError = {
        response: {
          data: {
            success: false,
            error: 'Invalid refresh token',
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(authApi.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should send logout request', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Logged out successfully',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    });

    it('should handle logout errors gracefully', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Logout failed'));

      // Logout should not throw, just log the error
      await expect(authApi.logout()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            createdAt: new Date().toISOString(),
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authApi.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle unauthorized errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            success: false,
            error: 'Unauthorized',
          },
        },
      };

      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      await expect(authApi.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should extract error message from response', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Custom error message',
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(authApi.login({ email: 'test@test.com', password: 'test' }))
        .rejects.toThrow('Custom error message');
    });

    it('should use default message for network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).request = {};

      vi.mocked(apiClient.post).mockRejectedValue(networkError);

      await expect(authApi.login({ email: 'test@test.com', password: 'test' }))
        .rejects.toThrow('Network Error');
    });

    it('should handle unknown errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Unknown error'));

      await expect(authApi.login({ email: 'test@test.com', password: 'test' }))
        .rejects.toThrow('Unknown error');
    });
  });
});
