'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntry } from '../types/auth';
import { getAuthService } from '../services/auth';

interface LeaderboardPanelProps {
  currentUserId?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ 
  currentUserId, 
  onClose,
  isModal = false 
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'today'>('all');

  const loadLeaderboard = useCallback(() => {
    setLoading(true);
    const authService = getAuthService();
    
    // 如果排行榜为空，添加一些测试数据
    let leaderboard = authService.getLeaderboard(50);
    if (leaderboard.length === 0) {
      authService.seedLeaderboard();
      leaderboard = authService.getLeaderboard(50);
    }

    // 根据时间筛选
    if (timeFilter !== 'all') {
      const now = Date.now();
      const cutoff = timeFilter === 'today' 
        ? now - 24 * 60 * 60 * 1000 
        : now - 7 * 24 * 60 * 60 * 1000;
      
      leaderboard = leaderboard.filter(e => 
        new Date(e.timestamp).getTime() > cutoff
      );
    }

    setEntries(leaderboard);
    setLoading(false);
  }, [timeFilter]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number): string => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 2: return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/50';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
      default: return 'bg-gray-800/50 border-gray-700';
    }
  };

  const content = (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${isModal ? '' : ''}`}>
      {/* 头部 */}
      <div className="relative px-6 py-4 border-b border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 via-orange-600/10 to-red-600/10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🏆 排行榜
            </h2>
            <p className="text-sm text-gray-400 mt-1">最佳配送成绩</p>
          </div>
          
          {/* 时间筛选 */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
            {(['all', 'week', 'today'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter === 'all' ? '全部' : filter === 'week' ? '本周' : '今日'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-800/50 text-xs text-gray-500 border-b border-gray-700">
        <div className="col-span-1 text-center">排名</div>
        <div className="col-span-4">玩家</div>
        <div className="col-span-2 text-center">等级</div>
        <div className="col-span-2 text-right">得分</div>
        <div className="col-span-2 text-right">任务</div>
        <div className="col-span-1 text-right">准时</div>
      </div>

      {/* 排行榜列表 */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📊</div>
            <div>暂无数据</div>
            <div className="text-sm mt-1">完成游戏后即可上榜</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {entries.map((entry) => (
              <div
                key={entry.userId}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors hover:bg-gray-800/50 ${
                  entry.userId === currentUserId ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                } ${getRankStyle(entry.rank)}`}
              >
                {/* 排名 */}
                <div className="col-span-1 text-center">
                  <span className={`${entry.rank <= 3 ? 'text-xl' : 'text-sm text-gray-400'}`}>
                    {getRankIcon(entry.rank)}
                  </span>
                </div>

                {/* 玩家信息 */}
                <div className="col-span-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">
                      {entry.username}
                      {entry.userId === currentUserId && (
                        <span className="ml-1 text-xs text-blue-400">(我)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 等级 */}
                <div className="col-span-2 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    Lv.{entry.level}
                  </span>
                </div>

                {/* 得分 */}
                <div className="col-span-2 text-right">
                  <span className="font-bold text-orange-400">
                    {entry.score.toLocaleString()}
                  </span>
                </div>

                {/* 完成任务数 */}
                <div className="col-span-2 text-right text-gray-300">
                  {entry.completedTasks}
                </div>

                {/* 准时率 */}
                <div className="col-span-1 text-right">
                  <span className={`text-sm ${
                    entry.onTimeRate >= 90 ? 'text-green-400' :
                    entry.onTimeRate >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {entry.onTimeRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部 */}
      {currentUserId && (
        <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700">
          {(() => {
            const authService = getAuthService();
            const userRank = authService.getUserRank(currentUserId);
            if (userRank > 0) {
              return (
                <div className="text-sm text-center text-gray-400">
                  您当前排名 <span className="text-blue-400 font-bold">第{userRank}名</span>
                </div>
              );
            }
            return (
              <div className="text-sm text-center text-gray-400">
                完成游戏即可上榜
              </div>
            );
          })()}
        </div>
      )}

      {/* 关闭按钮（仅模态框模式） */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );

  // 模态框模式
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl mx-4 animate-fadeIn">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// 迷你排行榜（用于侧边栏）
export const MiniLeaderboard: React.FC<{
  currentUserId?: string;
  onViewAll?: () => void;
}> = ({ currentUserId, onViewAll }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => {
    // 惰性初始化
    if (typeof window === 'undefined') return [];
    const authService = getAuthService();
    let leaderboard = authService.getLeaderboard(5);
    if (leaderboard.length === 0) {
      authService.seedLeaderboard();
      leaderboard = authService.getLeaderboard(5);
    }
    return leaderboard;
  });

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          🏆 排行榜
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            查看全部 →
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-800">
        {entries.slice(0, 5).map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 px-4 py-2 ${
              entry.userId === currentUserId ? 'bg-blue-500/10' : ''
            }`}
          >
            <span className={`w-6 text-center ${
              entry.rank === 1 ? 'text-lg' : 'text-sm text-gray-500'
            }`}>
              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}`}
            </span>
            <span className="flex-1 text-sm text-white truncate">
              {entry.username}
            </span>
            <span className="text-sm text-orange-400 font-medium">
              {entry.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPanel;
