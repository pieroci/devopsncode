import { create } from 'zustand';
import type { User, AuthResponse } from '@/types';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY } from '@/utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAuth: (authResponse: AuthResponse) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setAuth: (authResponse: AuthResponse) => {
    const { user, token, refreshToken } = authResponse;
    
    // Save to localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      error: null,
    });
  },

  setUser: (user: User) => {
    // Update user in localStorage
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    
    set({ user });
  },

  logout: () => {
    // Clear localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const userDataStr = localStorage.getItem(USER_DATA_KEY);

      if (token && refreshToken && userDataStr) {
        const user = JSON.parse(userDataStr) as User;
        
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      // If there's an error parsing localStorage data, just ignore it
      console.error('Error loading auth from storage:', error);
    }
  },
}));
