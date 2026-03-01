// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

// Player Types
export interface Player {
  id: string;
  userId: string;
  username: string;
  level: number;
  experience: number;
  currentElo: number;
  rank: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  createdAt: string;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  currentElo: number;
  highestElo: number;
  rank: string;
  totalKills: number;
  totalDeaths: number;
  kd: number;
  averageScore: number;
}

// World Types
export interface World {
  id: string;
  name: string;
  description: string;
  maxPlayers: number;
  currentPlayers: number;
  region: string;
  mapData: string;
  isActive: boolean;
}

// Game Types
export interface GameSession {
  id: string;
  worldId: string;
  hostPlayerId: string;
  status: 'waiting' | 'starting' | 'active' | 'finished';
  startTime?: string;
  endTime?: string;
  maxPlayers: number;
  currentPlayers: number;
  players: GamePlayer[];
}

export interface GamePlayer {
  playerId: string;
  username: string;
  teamId?: string;
  isReady: boolean;
  x: number;
  y: number;
  rotation: number;
  speed: number;
  lap: number;
  position: number;
}

// Match Types
export interface Match {
  id: string;
  worldId: string;
  status: 'pending' | 'active' | 'completed';
  startTime?: string;
  endTime?: string;
  winningTeamId?: string;
  players: MatchPlayer[];
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  score: number;
  kills: number;
  deaths: number;
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
}

// Matchmaking Types
export interface MatchmakingQueue {
  playerId: string;
  currentElo: number;
  preferredMode: string;
  joinedAt: string;
  status: 'queued' | 'matched' | 'cancelled';
}

export interface MatchmakingStatus {
  isInQueue: boolean;
  queuedSince?: string;
  estimatedWaitTime?: number;
  playersInQueue: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  elo: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'match_found' | 'game_started' | 'game_ended' | 'achievement' | 'friend_request';
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// SignalR Event Types
export interface PlayerMovedEvent {
  playerId: string;
  x: number;
  y: number;
  rotation: number;
  speed: number;
}

export interface PowerUpCollectedEvent {
  powerUpId: string;
  playerId: string;
  powerUpType: string;
}

export interface PlayerCollisionEvent {
  attackerId: string;
  victimId: string;
  damage: number;
}

export interface RaceFinishedEvent {
  matchId: string;
  results: MatchPlayer[];
}

// Power-up Types
export interface PowerUp {
  id: string;
  type: 'speed_boost' | 'shield' | 'missile' | 'mine';
  x: number;
  y: number;
  isCollected: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
