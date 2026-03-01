// API Base URL from environment or default to Gateway
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// SignalR Hub URLs
export const GAME_HUB_URL = `${API_BASE_URL}/hubs/game`;
export const NOTIFICATION_HUB_URL = `${API_BASE_URL}/hubs/notification`;

// Local Storage Keys
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_DATA_KEY = 'user_data';

// Game Constants
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const UPDATES_PER_SECOND = 20;
export const UPDATE_INTERVAL = 1000 / UPDATES_PER_SECOND;

// Player Movement
export const PLAYER_SPEED = 200;
export const PLAYER_MAX_SPEED = 400;
export const PLAYER_ACCELERATION = 50;
export const PLAYER_DRAG = 0.95;
export const DRIFT_ANGLE = 30;

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  player: {
    me: '/api/player/me',
    get: (id: string) => `/api/player/${id}`,
    update: (id: string) => `/api/player/${id}`,
    stats: (id: string) => `/api/player/${id}/stats`,
    achievements: (id: string) => `/api/player/${id}/achievements`,
  },
  world: {
    list: '/api/world',
    get: (id: string) => `/api/world/${id}`,
    join: (id: string) => `/api/world/${id}/player`,
  },
  game: {
    sessions: '/api/game/sessions',
    getSession: (id: string) => `/api/game/sessions/${id}`,
    start: (id: string) => `/api/game/sessions/${id}/start`,
    end: (id: string) => `/api/game/sessions/${id}/end`,
  },
  matchmaking: {
    join: '/api/matchmaking/join',
    leave: '/api/matchmaking/leave',
    status: '/api/matchmaking/status',
  },
  match: {
    get: (id: string) => `/api/match/${id}`,
    end: (id: string) => `/api/match/${id}/end`,
    history: '/api/match/history',
  },
  leaderboard: {
    global: '/api/leaderboard/global',
    rank: (playerId: string) => `/api/leaderboard/rank/${playerId}`,
  },
};
