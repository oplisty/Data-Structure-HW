// 用户相关类型定义

export interface User {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  totalScore: number;
  bestScore: number;
  gamesPlayed: number;
  achievements: string[];
  createdAt: Date;
  lastLoginAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  score: number;
  completedTasks: number;
  onTimeRate: number;
  timestamp: Date;
}

export interface GameRecord {
  id: string;
  oderId: string;
  score: number;
  completedTasks: number;
  failedTasks: number;
  onTimeRate: number;
  totalDistance: number;
  strategy: string;
  scale: string;
  duration: number;
  timestamp: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
}

// 本地存储的用户数据
export interface LocalUserData {
  currentUser: User | null;
  users: User[];
  leaderboard: LeaderboardEntry[];
  gameRecords: GameRecord[];
}

// 初始化本地用户数据
export const initLocalUserData = (): LocalUserData => ({
  currentUser: null,
  users: [],
  leaderboard: [],
  gameRecords: []
});

// 本地存储键名
export const STORAGE_KEYS = {
  USER_DATA: 'logistics_user_data',
  CURRENT_USER: 'logistics_current_user',
  LEADERBOARD: 'logistics_leaderboard',
  GAME_RECORDS: 'logistics_game_records'
} as const;
