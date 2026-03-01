import { describe, it, expect } from 'vitest';
import {
  API_BASE_URL,
  GAME_HUB_URL,
  NOTIFICATION_HUB_URL,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
  GAME_WIDTH,
  GAME_HEIGHT,
  UPDATES_PER_SECOND,
  UPDATE_INTERVAL,
  PLAYER_SPEED,
  PLAYER_MAX_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_DRAG,
  DRIFT_ANGLE,
  API_ENDPOINTS,
} from './constants';

describe('Constants', () => {
  describe('API Configuration', () => {
    it('should have a valid API base URL', () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
      expect(API_BASE_URL).toMatch(/^https?:\/\//);
    });

    it('should have SignalR hub URLs derived from base URL', () => {
      expect(GAME_HUB_URL).toBe(`${API_BASE_URL}/hubs/game`);
      expect(NOTIFICATION_HUB_URL).toBe(`${API_BASE_URL}/hubs/notification`);
    });
  });

  describe('Local Storage Keys', () => {
    it('should have defined storage keys', () => {
      expect(AUTH_TOKEN_KEY).toBe('auth_token');
      expect(REFRESH_TOKEN_KEY).toBe('refresh_token');
      expect(USER_DATA_KEY).toBe('user_data');
    });

    it('should have unique storage keys', () => {
      const keys = [AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY];
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('Game Configuration', () => {
    it('should have valid game dimensions', () => {
      expect(GAME_WIDTH).toBe(1280);
      expect(GAME_HEIGHT).toBe(720);
      expect(GAME_WIDTH).toBeGreaterThan(0);
      expect(GAME_HEIGHT).toBeGreaterThan(0);
    });

    it('should have valid aspect ratio (16:9)', () => {
      const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
      expect(aspectRatio).toBeCloseTo(16 / 9, 2);
    });

    it('should have valid update rate configuration', () => {
      expect(UPDATES_PER_SECOND).toBe(20);
      expect(UPDATE_INTERVAL).toBe(1000 / UPDATES_PER_SECOND);
      expect(UPDATE_INTERVAL).toBe(50);
    });
  });

  describe('Player Physics', () => {
    it('should have valid player speed configuration', () => {
      expect(PLAYER_SPEED).toBe(200);
      expect(PLAYER_MAX_SPEED).toBe(400);
      expect(PLAYER_ACCELERATION).toBe(50);
      expect(PLAYER_DRAG).toBe(0.95);
    });

    it('should have max speed greater than base speed', () => {
      expect(PLAYER_MAX_SPEED).toBeGreaterThan(PLAYER_SPEED);
    });

    it('should have valid drag coefficient', () => {
      expect(PLAYER_DRAG).toBeGreaterThan(0);
      expect(PLAYER_DRAG).toBeLessThanOrEqual(1);
    });

    it('should have valid drift angle', () => {
      expect(DRIFT_ANGLE).toBe(30);
      expect(DRIFT_ANGLE).toBeGreaterThan(0);
      expect(DRIFT_ANGLE).toBeLessThan(90);
    });
  });

  describe('API Endpoints', () => {
    describe('Auth Endpoints', () => {
      it('should have all auth endpoints defined', () => {
        expect(API_ENDPOINTS.auth.login).toBe('/api/auth/login');
        expect(API_ENDPOINTS.auth.register).toBe('/api/auth/register');
        expect(API_ENDPOINTS.auth.refresh).toBe('/api/auth/refresh');
        expect(API_ENDPOINTS.auth.logout).toBe('/api/auth/logout');
        expect(API_ENDPOINTS.auth.me).toBe('/api/auth/me');
      });

      it('should have endpoints starting with /api', () => {
        Object.values(API_ENDPOINTS.auth).forEach((endpoint) => {
          if (typeof endpoint === 'string') {
            expect(endpoint).toMatch(/^\/api\//);
          }
        });
      });
    });

    describe('Player Endpoints', () => {
      it('should have player endpoints', () => {
        expect(API_ENDPOINTS.player.me).toBe('/api/player/me');
      });

      it('should generate player-specific endpoints', () => {
        const playerId = 'player-123';
        expect(API_ENDPOINTS.player.get(playerId)).toBe(`/api/player/${playerId}`);
        expect(API_ENDPOINTS.player.update(playerId)).toBe(`/api/player/${playerId}`);
        expect(API_ENDPOINTS.player.stats(playerId)).toBe(`/api/player/${playerId}/stats`);
        expect(API_ENDPOINTS.player.achievements(playerId)).toBe(`/api/player/${playerId}/achievements`);
      });
    });

    describe('World Endpoints', () => {
      it('should have world endpoints', () => {
        expect(API_ENDPOINTS.world.list).toBe('/api/world');
      });

      it('should generate world-specific endpoints', () => {
        const worldId = 'world-123';
        expect(API_ENDPOINTS.world.get(worldId)).toBe(`/api/world/${worldId}`);
        expect(API_ENDPOINTS.world.join(worldId)).toBe(`/api/world/${worldId}/player`);
      });
    });

    describe('Game Endpoints', () => {
      it('should have game session endpoints', () => {
        expect(API_ENDPOINTS.game.sessions).toBe('/api/game/sessions');
      });

      it('should generate game-specific endpoints', () => {
        const sessionId = 'session-123';
        expect(API_ENDPOINTS.game.getSession(sessionId)).toBe(`/api/game/sessions/${sessionId}`);
        expect(API_ENDPOINTS.game.start(sessionId)).toBe(`/api/game/sessions/${sessionId}/start`);
        expect(API_ENDPOINTS.game.end(sessionId)).toBe(`/api/game/sessions/${sessionId}/end`);
      });
    });

    describe('Matchmaking Endpoints', () => {
      it('should have matchmaking endpoints', () => {
        expect(API_ENDPOINTS.matchmaking.join).toBe('/api/matchmaking/join');
        expect(API_ENDPOINTS.matchmaking.leave).toBe('/api/matchmaking/leave');
        expect(API_ENDPOINTS.matchmaking.status).toBe('/api/matchmaking/status');
      });
    });

    describe('Match Endpoints', () => {
      it('should have match history endpoint', () => {
        expect(API_ENDPOINTS.match.history).toBe('/api/match/history');
      });

      it('should generate match-specific endpoints', () => {
        const matchId = 'match-123';
        expect(API_ENDPOINTS.match.get(matchId)).toBe(`/api/match/${matchId}`);
        expect(API_ENDPOINTS.match.end(matchId)).toBe(`/api/match/${matchId}/end`);
      });
    });

    describe('Leaderboard Endpoints', () => {
      it('should have leaderboard endpoints', () => {
        expect(API_ENDPOINTS.leaderboard.global).toBe('/api/leaderboard/global');
      });

      it('should generate player rank endpoint', () => {
        const playerId = 'player-123';
        expect(API_ENDPOINTS.leaderboard.rank(playerId)).toBe(`/api/leaderboard/rank/${playerId}`);
      });
    });
  });

  describe('Configuration Consistency', () => {
    it('should have all endpoint categories', () => {
      expect(API_ENDPOINTS).toHaveProperty('auth');
      expect(API_ENDPOINTS).toHaveProperty('player');
      expect(API_ENDPOINTS).toHaveProperty('world');
      expect(API_ENDPOINTS).toHaveProperty('game');
      expect(API_ENDPOINTS).toHaveProperty('matchmaking');
      expect(API_ENDPOINTS).toHaveProperty('match');
      expect(API_ENDPOINTS).toHaveProperty('leaderboard');
    });

    it('should have consistent URL structure', () => {
      const allEndpoints = [
        ...Object.values(API_ENDPOINTS.auth),
        API_ENDPOINTS.player.me,
        API_ENDPOINTS.world.list,
        API_ENDPOINTS.game.sessions,
        API_ENDPOINTS.matchmaking.join,
        API_ENDPOINTS.match.history,
        API_ENDPOINTS.leaderboard.global,
      ];

      allEndpoints.forEach((endpoint) => {
        if (typeof endpoint === 'string') {
          expect(endpoint).toMatch(/^\/api\/[a-z]+/);
        }
      });
    });
  });
});
