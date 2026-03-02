import { describe, it, expect } from 'vitest';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  Player,
  PlayerStats,
  World,
  GameSession,
  GamePlayer,
  Match,
  MatchPlayer,
  MatchmakingQueue,
  MatchmakingStatus,
  LeaderboardEntry,
  Notification,
  PlayerMovedEvent,
  PowerUpCollectedEvent,
  PlayerCollisionEvent,
  RaceFinishedEvent,
  PowerUp,
  ApiResponse,
  PaginatedResponse,
} from './index';

describe('Type Definitions', () => {
  describe('Auth Types', () => {
    it('should validate LoginCredentials structure', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(credentials).toHaveProperty('email');
      expect(credentials).toHaveProperty('password');
    });

    it('should validate RegisterData structure', () => {
      const registerData: RegisterData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      expect(registerData).toHaveProperty('username');
      expect(registerData).toHaveProperty('email');
      expect(registerData).toHaveProperty('password');
      expect(registerData).toHaveProperty('confirmPassword');
    });

    it('should validate AuthResponse structure', () => {
      const authResponse: AuthResponse = {
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date().toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      expect(authResponse).toHaveProperty('token');
      expect(authResponse).toHaveProperty('refreshToken');
      expect(authResponse).toHaveProperty('expiresAt');
      expect(authResponse).toHaveProperty('user');
    });

    it('should validate User structure', () => {
      const user: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('createdAt');
    });
  });

  describe('Player Types', () => {
    it('should validate Player structure', () => {
      const player: Player = {
        id: '1',
        userId: '1',
        username: 'testplayer',
        level: 1,
        experience: 0,
        currentElo: 1200,
        rank: 'Bronze',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: new Date().toISOString(),
      };

      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('userId');
      expect(player).toHaveProperty('currentElo');
      expect(player).toHaveProperty('rank');
      expect(player.currentElo).toBeGreaterThanOrEqual(0);
    });

    it('should validate PlayerStats structure', () => {
      const stats: PlayerStats = {
        totalGames: 10,
        wins: 7,
        losses: 3,
        winRate: 0.7,
        currentElo: 1400,
        highestElo: 1500,
        rank: 'Silver',
        totalKills: 50,
        totalDeaths: 30,
        kd: 1.67,
        averageScore: 1000,
      };

      expect(stats).toHaveProperty('totalGames');
      expect(stats).toHaveProperty('wins');
      expect(stats).toHaveProperty('losses');
      expect(stats).toHaveProperty('winRate');
      expect(stats.wins + stats.losses).toBeLessThanOrEqual(stats.totalGames);
      expect(stats.winRate).toBeGreaterThanOrEqual(0);
      expect(stats.winRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Game Types', () => {
    it('should validate GameSession structure', () => {
      const session: GameSession = {
        id: 'session-1',
        worldId: 'world-1',
        hostPlayerId: 'player-1',
        status: 'waiting',
        maxPlayers: 4,
        currentPlayers: 2,
        players: [],
      };

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('worldId');
      expect(session).toHaveProperty('status');
      expect(['waiting', 'starting', 'active', 'finished']).toContain(session.status);
    });

    it('should validate GamePlayer structure', () => {
      const player: GamePlayer = {
        playerId: 'player-1',
        username: 'testplayer',
        isReady: true,
        x: 100,
        y: 200,
        rotation: 0,
        speed: 150,
        lap: 1,
        position: 1,
      };

      expect(player).toHaveProperty('playerId');
      expect(player).toHaveProperty('x');
      expect(player).toHaveProperty('y');
      expect(player).toHaveProperty('rotation');
      expect(player).toHaveProperty('speed');
      expect(player).toHaveProperty('lap');
      expect(player).toHaveProperty('position');
    });

    it('should validate PowerUp structure', () => {
      const powerUp: PowerUp = {
        id: 'powerup-1',
        type: 'speed_boost',
        x: 300,
        y: 400,
        isCollected: false,
      };

      expect(powerUp).toHaveProperty('id');
      expect(powerUp).toHaveProperty('type');
      expect(['speed_boost', 'shield', 'missile', 'mine']).toContain(powerUp.type);
      expect(powerUp).toHaveProperty('x');
      expect(powerUp).toHaveProperty('y');
    });
  });

  describe('Match Types', () => {
    it('should validate Match structure', () => {
      const match: Match = {
        id: 'match-1',
        worldId: 'world-1',
        status: 'active',
        players: [],
      };

      expect(match).toHaveProperty('id');
      expect(match).toHaveProperty('worldId');
      expect(match).toHaveProperty('status');
      expect(['pending', 'active', 'completed']).toContain(match.status);
    });

    it('should validate MatchPlayer structure', () => {
      const matchPlayer: MatchPlayer = {
        id: '1',
        matchId: 'match-1',
        playerId: 'player-1',
        teamId: 'team-1',
        score: 1500,
        kills: 10,
        deaths: 5,
        eloBefore: 1400,
        eloAfter: 1420,
        eloChange: 20,
      };

      expect(matchPlayer).toHaveProperty('eloBefore');
      expect(matchPlayer).toHaveProperty('eloAfter');
      expect(matchPlayer).toHaveProperty('eloChange');
      expect(matchPlayer.eloAfter - matchPlayer.eloBefore).toBe(matchPlayer.eloChange);
    });
  });

  describe('Matchmaking Types', () => {
    it('should validate MatchmakingQueue structure', () => {
      const queue: MatchmakingQueue = {
        playerId: 'player-1',
        currentElo: 1400,
        preferredMode: '2v2',
        joinedAt: new Date().toISOString(),
        status: 'queued',
      };

      expect(queue).toHaveProperty('playerId');
      expect(queue).toHaveProperty('currentElo');
      expect(['queued', 'matched', 'cancelled']).toContain(queue.status);
    });

    it('should validate MatchmakingStatus structure', () => {
      const status: MatchmakingStatus = {
        isInQueue: true,
        queuedSince: new Date().toISOString(),
        estimatedWaitTime: 30,
        playersInQueue: 5,
      };

      expect(status).toHaveProperty('isInQueue');
      expect(typeof status.isInQueue).toBe('boolean');
    });
  });

  describe('Leaderboard Types', () => {
    it('should validate LeaderboardEntry structure', () => {
      const entry: LeaderboardEntry = {
        rank: 1,
        playerId: 'player-1',
        username: 'topplayer',
        elo: 1800,
        gamesPlayed: 100,
        wins: 70,
        losses: 30,
        winRate: 0.7,
      };

      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('elo');
      expect(entry).toHaveProperty('winRate');
      expect(entry.rank).toBeGreaterThan(0);
      expect(entry.winRate).toBeGreaterThanOrEqual(0);
      expect(entry.winRate).toBeLessThanOrEqual(1);
    });
  });

  describe('SignalR Event Types', () => {
    it('should validate PlayerMovedEvent structure', () => {
      const event: PlayerMovedEvent = {
        playerId: 'player-1',
        x: 100,
        y: 200,
        rotation: 45,
        speed: 150,
      };

      expect(event).toHaveProperty('playerId');
      expect(event).toHaveProperty('x');
      expect(event).toHaveProperty('y');
      expect(event).toHaveProperty('rotation');
      expect(event).toHaveProperty('speed');
    });

    it('should validate PowerUpCollectedEvent structure', () => {
      const event: PowerUpCollectedEvent = {
        powerUpId: 'powerup-1',
        playerId: 'player-1',
        powerUpType: 'speed_boost',
      };

      expect(event).toHaveProperty('powerUpId');
      expect(event).toHaveProperty('playerId');
      expect(event).toHaveProperty('powerUpType');
    });

    it('should validate PlayerCollisionEvent structure', () => {
      const event: PlayerCollisionEvent = {
        attackerId: 'player-1',
        victimId: 'player-2',
        damage: 50,
      };

      expect(event).toHaveProperty('attackerId');
      expect(event).toHaveProperty('victimId');
      expect(event).toHaveProperty('damage');
    });

    it('should validate RaceFinishedEvent structure', () => {
      const event: RaceFinishedEvent = {
        matchId: 'match-1',
        results: [],
      };

      expect(event).toHaveProperty('matchId');
      expect(event).toHaveProperty('results');
      expect(Array.isArray(event.results)).toBe(true);
    });
  });

  describe('API Response Types', () => {
    it('should validate ApiResponse structure', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test data',
        message: 'Success',
      };

      expect(response).toHaveProperty('success');
      expect(typeof response.success).toBe('boolean');
    });

    it('should validate error ApiResponse structure', () => {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Error occurred',
        message: 'Failed',
      };

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
    });

    it('should validate PaginatedResponse structure', () => {
      const response: PaginatedResponse<string> = {
        items: ['item1', 'item2', 'item3'],
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10,
      };

      expect(response).toHaveProperty('items');
      expect(Array.isArray(response.items)).toBe(true);
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('page');
      expect(response).toHaveProperty('pageSize');
      expect(response).toHaveProperty('totalPages');
      expect(Math.ceil(response.total / response.pageSize)).toBe(response.totalPages);
    });
  });

  describe('Type Safety', () => {
    it('should enforce type constraints at compile time', () => {
      // This test validates that TypeScript compilation succeeds with correct types
      const validUser: User = {
        id: '1',
        username: 'test',
        email: 'test@test.com',
        createdAt: new Date().toISOString(),
      };

      expect(validUser).toBeDefined();
    });
  });
});
