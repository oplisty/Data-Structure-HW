'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { getAuthService } from '../services/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const authService = getAuthService();

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('两次密码输入不一致');
          setLoading(false);
          return;
        }
        const result = authService.register(username, password);
        if (result.success && result.user) {
          onLogin(result.user);
          onClose();
        } else {
          setError(result.message);
        }
      } else {
        const result = authService.login(username, password);
        if (result.success && result.user) {
          onLogin(result.user);
          onClose();
        } else {
          setError(result.message);
        }
      }
    } catch {
      setError('操作失败，请重试');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框 */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md mx-4 animate-fadeIn">
        {/* 头部 */}
        <div className="relative p-6 border-b border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-t-2xl" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white text-center">
              {mode === 'login' ? '🚀 欢迎回来' : '🎮 加入车队'}
            </h2>
            <p className="text-gray-400 text-sm text-center mt-2">
              {mode === 'login' 
                ? '登录以保存您的游戏记录和成就' 
                : '创建账号开始您的物流之旅'}
            </p>
          </div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="输入用户名"
              required
              minLength={2}
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="输入密码"
              required
              minLength={4}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="再次输入密码"
                required
                minLength={4}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              mode === 'login' ? '登 录' : '注 册'
            )}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="p-6 pt-0 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// 用户信息显示组件
interface UserProfileProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLoginClick, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-blue-500/20"
      >
        🔐 登录 / 注册
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        {/* 头像 */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        
        {/* 用户信息 */}
        <div className="text-left">
          <div className="text-sm font-medium text-white">{user.username}</div>
          <div className="text-xs text-gray-400">Lv.{user.level} · {user.totalScore.toFixed(0)}分</div>
        </div>

        {/* 下拉箭头 */}
        <span className={`text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-2 animate-fadeIn">
            <div className="px-4 py-2 border-b border-gray-700">
              <div className="text-xs text-gray-500">游戏统计</div>
              <div className="text-sm text-white mt-1">
                已玩 {user.gamesPlayed} 局 · 最高 {user.bestScore.toFixed(0)}分
              </div>
            </div>
            
            <button
              onClick={() => {
                onLogout();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors"
            >
              🚪 退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// 用户状态Hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    // 惰性初始化，避免在effect中调用setState
    if (typeof window === 'undefined') return null;
    return getAuthService().getCurrentUser();
  });
  const [loading, setLoading] = useState(false);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const logout = () => {
    const authService = getAuthService();
    authService.logout();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    const authService = getAuthService();
    const updated = authService.updateUser(updates);
    if (updated) {
      setUser(updated);
    }
  };

  return { user, loading, login, logout, updateUser };
};

export default LoginModal;
