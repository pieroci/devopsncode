import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './authStore';
import type { User, AuthResponse } from '@/types';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('should set authentication data', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockAuthResponse: AuthResponse = {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      act(() => {
        result.current.setAuth(mockAuthResponse);
      });

      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(result.current.token).toBe(mockAuthResponse.token);
      expect(result.current.refreshToken).toBe(mockAuthResponse.refreshToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should save tokens to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockAuthResponse: AuthResponse = {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      act(() => {
        result.current.setAuth(mockAuthResponse);
      });

      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.token);
      expect(localStorage.getItem('refresh_token')).toBe(mockAuthResponse.refreshToken);
      expect(localStorage.getItem('user_data')).toBe(JSON.stringify(mockAuthResponse.user));
    });
  });

  describe('setUser', () => {
    it('should update user data', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should update user in localStorage', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser: User = {
        id: '1',
        username: 'updateduser',
        email: 'updated@example.com',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(localStorage.getItem('user_data')).toBe(JSON.stringify(mockUser));
    });
  });

  describe('logout', () => {
    it('should clear authentication state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // First login
      const mockAuthResponse: AuthResponse = {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      act(() => {
        result.current.setAuth(mockAuthResponse);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear localStorage', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // First login
      const mockAuthResponse: AuthResponse = {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      act(() => {
        result.current.setAuth(mockAuthResponse);
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const errorMessage = 'Authentication failed';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('loadFromStorage', () => {
    it('should load auth data from localStorage', () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      };

      // Set data in localStorage
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('refresh_token', 'stored-refresh-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.loadFromStorage();
      });

      expect(result.current.token).toBe('stored-token');
      expect(result.current.refreshToken).toBe('stored-refresh-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle missing localStorage data gracefully', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.loadFromStorage();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('user_data', 'invalid-json');

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.loadFromStorage();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('should mark as authenticated when token exists', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockAuthResponse: AuthResponse = {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      act(() => {
        result.current.setAuth(mockAuthResponse);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBeTruthy();
    });

    it('should not mark as authenticated without token', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
    });
  });
});
