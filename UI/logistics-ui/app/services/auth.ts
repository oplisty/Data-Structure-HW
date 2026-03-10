'use client';

import { 
  User, 
  LeaderboardEntry, 
  GameRecord, 
  LocalUserData, 
  STORAGE_KEYS,
  initLocalUserData 
} from '../types/auth';

// 简单的密码哈希（实际项目中应使用bcrypt等）
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

class AuthService {
  private data: LocalUserData;
  private passwordStore: Map<string, string> = new Map();

  constructor() {
    this.data = initLocalUserData();
    this.loadFromStorage();
  }

  // 从本地存储加载数据
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        this.data.users = JSON.parse(userData);
      }

      const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (currentUser) {
        this.data.currentUser = JSON.parse(currentUser);
      }

      const leaderboard = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (leaderboard) {
        this.data.leaderboard = JSON.parse(leaderboard);
      }

      const gameRecords = localStorage.getItem(STORAGE_KEYS.GAME_RECORDS);
      if (gameRecords) {
        this.data.gameRecords = JSON.parse(gameRecords);
      }

      // 加载密码存储
      const passwords = localStorage.getItem('logistics_passwords');
      if (passwords) {
        const parsed = JSON.parse(passwords);
        this.passwordStore = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.error('Failed to load auth data:', e);
    }
  }

  // 保存到本地存储
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.data.users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.data.currentUser));
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(this.data.leaderboard));
      localStorage.setItem(STORAGE_KEYS.GAME_RECORDS, JSON.stringify(this.data.gameRecords));
      localStorage.setItem('logistics_passwords', JSON.stringify(Object.fromEntries(this.passwordStore)));
    } catch (e) {
      console.error('Failed to save auth data:', e);
    }
  }

  // 注册
  register(username: string, password: string): { success: boolean; message: string; user?: User } {
    // 检查用户名是否已存在
    if (this.data.users.find(u => u.username === username)) {
      return { success: false, message: '用户名已存在' };
    }

    if (username.length < 2 || username.length > 20) {
      return { success: false, message: '用户名长度需要在2-20个字符之间' };
    }

    if (password.length < 4) {
      return { success: false, message: '密码长度至少4个字符' };
    }

    const newUser: User = {
      id: generateId(),
      username,
      level: 1,
      totalScore: 0,
      bestScore: 0,
      gamesPlayed: 0,
      achievements: [],
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    this.data.users.push(newUser);
    this.passwordStore.set(newUser.id, simpleHash(password));
    this.data.currentUser = newUser;
    this.saveToStorage();

    return { success: true, message: '注册成功', user: newUser };
  }

  // 登录
  login(username: string, password: string): { success: boolean; message: string; user?: User } {
    const user = this.data.users.find(u => u.username === username);
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const storedHash = this.passwordStore.get(user.id);
    if (storedHash !== simpleHash(password)) {
      return { success: false, message: '密码错误' };
    }

    user.lastLoginAt = new Date();
    this.data.currentUser = user;
    this.saveToStorage();

    return { success: true, message: '登录成功', user };
  }

  // 登出
  logout(): void {
    this.data.currentUser = null;
    this.saveToStorage();
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    return this.data.currentUser;
  }

  // 更新用户数据
  updateUser(updates: Partial<User>): User | null {
    if (!this.data.currentUser) return null;

    const userIndex = this.data.users.findIndex(u => u.id === this.data.currentUser!.id);
    if (userIndex === -1) return null;

    this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
    this.data.currentUser = this.data.users[userIndex];
    this.saveToStorage();

    return this.data.currentUser;
  }

  // 提交游戏记录
  submitGameRecord(record: Omit<GameRecord, 'id' | 'timestamp'>): GameRecord | null {
    if (!this.data.currentUser) return null;

    const newRecord: GameRecord = {
      ...record,
      id: generateId(),
      timestamp: new Date()
    };

    this.data.gameRecords.push(newRecord);

    // 更新用户统计
    this.data.currentUser.gamesPlayed += 1;
    this.data.currentUser.totalScore += record.score;
    if (record.score > this.data.currentUser.bestScore) {
      this.data.currentUser.bestScore = record.score;
    }

    // 计算等级
    const newLevel = Math.floor(this.data.currentUser.totalScore / 1000) + 1;
    this.data.currentUser.level = Math.min(newLevel, 99);

    // 更新排行榜
    this.updateLeaderboard({
      oderId: this.data.currentUser.id,
      username: this.data.currentUser.username,
      avatar: this.data.currentUser.avatar,
      level: this.data.currentUser.level,
      score: record.score,
      completedTasks: record.completedTasks,
      onTimeRate: record.onTimeRate,
      timestamp: new Date()
    });

    this.updateUser(this.data.currentUser);
    this.saveToStorage();

    return newRecord;
  }

  // 更新排行榜
  private updateLeaderboard(entry: Omit<LeaderboardEntry, 'rank' | 'userId'> & { oderId: string }): void {
    // 只保留每个用户的最高分
    const existingIndex = this.data.leaderboard.findIndex(e => e.userId === entry.oderId);
    
    const newEntry: LeaderboardEntry = {
      rank: 0,
      userId: entry.oderId,
      username: entry.username,
      avatar: entry.avatar,
      level: entry.level,
      score: entry.score,
      completedTasks: entry.completedTasks,
      onTimeRate: entry.onTimeRate,
      timestamp: entry.timestamp
    };

    if (existingIndex !== -1) {
      if (entry.score > this.data.leaderboard[existingIndex].score) {
        this.data.leaderboard[existingIndex] = newEntry;
      }
    } else {
      this.data.leaderboard.push(newEntry);
    }

    // 排序并更新排名
    this.data.leaderboard.sort((a, b) => b.score - a.score);
    this.data.leaderboard.forEach((e, i) => e.rank = i + 1);

    // 只保留前100名
    this.data.leaderboard = this.data.leaderboard.slice(0, 100);
  }

  // 获取排行榜
  getLeaderboard(limit: number = 20): LeaderboardEntry[] {
    return this.data.leaderboard.slice(0, limit);
  }

  // 获取用户排名
  getUserRank(userId: string): number {
    const entry = this.data.leaderboard.find(e => e.userId === userId);
    return entry ? entry.rank : -1;
  }

  // 获取用户游戏记录
  getUserGameRecords(userId: string, limit: number = 10): GameRecord[] {
    return this.data.gameRecords
      .filter(r => r.oderId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // 添加一些测试用户到排行榜（仅开发用）
  seedLeaderboard(): void {
    const testUsers = [
      { username: '物流大师', score: 15000, level: 15, tasks: 120, rate: 95 },
      { username: '配送王者', score: 12500, level: 12, tasks: 100, rate: 92 },
      { username: '新能源先锋', score: 10000, level: 10, tasks: 85, rate: 88 },
      { username: '闪电配送', score: 8500, level: 8, tasks: 70, rate: 90 },
      { username: '绿色物流', score: 7200, level: 7, tasks: 60, rate: 85 },
      { username: '智能调度', score: 6000, level: 6, tasks: 50, rate: 87 },
      { username: '效率专家', score: 4500, level: 5, tasks: 40, rate: 82 },
      { username: '新手司机', score: 2000, level: 2, tasks: 20, rate: 75 },
    ];

    testUsers.forEach((u, i) => {
      const entry: LeaderboardEntry = {
        rank: i + 1,
        userId: `test_${i}`,
        username: u.username,
        level: u.level,
        score: u.score,
        completedTasks: u.tasks,
        onTimeRate: u.rate,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7)
      };
      
      const existingIndex = this.data.leaderboard.findIndex(e => e.userId === entry.userId);
      if (existingIndex === -1) {
        this.data.leaderboard.push(entry);
      }
    });

    this.data.leaderboard.sort((a, b) => b.score - a.score);
    this.data.leaderboard.forEach((e, i) => e.rank = i + 1);
    this.saveToStorage();
  }
}

// 单例导出
let authServiceInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

export default AuthService;
