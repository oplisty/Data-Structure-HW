'use client';

import React, { useEffect, useState } from 'react';
import { Statistics } from '../types';

// 成就定义
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: Statistics) => boolean;
  reward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

// 成就列表
const ACHIEVEMENTS: Achievement[] = [
  // 任务完成类
  {
    id: 'first_delivery',
    title: '初出茅庐',
    description: '完成第一个配送任务',
    icon: '🎯',
    condition: (s) => s.completedTasks >= 1,
    reward: 100,
    tier: 'bronze'
  },
  {
    id: 'ten_deliveries',
    title: '老司机',
    description: '完成10个配送任务',
    icon: '🚚',
    condition: (s) => s.completedTasks >= 10,
    reward: 500,
    tier: 'silver'
  },
  {
    id: 'fifty_deliveries',
    title: '王牌配送员',
    description: '完成50个配送任务',
    icon: '👑',
    condition: (s) => s.completedTasks >= 50,
    reward: 2000,
    tier: 'gold'
  },
  {
    id: 'hundred_deliveries',
    title: '传奇车队',
    description: '完成100个配送任务',
    icon: '🏆',
    condition: (s) => s.completedTasks >= 100,
    reward: 5000,
    tier: 'diamond'
  },
  // 效率类
  {
    id: 'perfect_rate',
    title: '准时达人',
    description: '准时率达到90%以上',
    icon: '⏰',
    condition: (s) => s.onTimeRate >= 90,
    reward: 1000,
    tier: 'gold'
  },
  {
    id: 'high_score',
    title: '财富积累',
    description: '总收益达到5000分',
    icon: '💎',
    condition: (s) => s.totalScore >= 5000,
    reward: 1500,
    tier: 'silver'
  },
  {
    id: 'mega_score',
    title: '物流大亨',
    description: '总收益达到20000分',
    icon: '🌟',
    condition: (s) => s.totalScore >= 20000,
    reward: 5000,
    tier: 'diamond'
  },
  // 距离类
  {
    id: 'marathon',
    title: '马拉松',
    description: '总行驶距离达到100公里',
    icon: '🛣️',
    condition: (s) => s.totalDistance >= 100,
    reward: 800,
    tier: 'silver'
  },
  // 特殊成就
  {
    id: 'no_failure',
    title: '零失误',
    description: '完成20个任务且无失败',
    icon: '✨',
    condition: (s) => s.completedTasks >= 20 && s.failedTasks === 0,
    reward: 3000,
    tier: 'gold'
  },
];

// 等级计算
const calculateLevel = (score: number): { level: number; progress: number; title: string } => {
  const levels = [
    { threshold: 0, title: '新手司机' },
    { threshold: 500, title: '初级配送员' },
    { threshold: 1500, title: '熟练配送员' },
    { threshold: 3000, title: '专业配送员' },
    { threshold: 6000, title: '资深配送员' },
    { threshold: 10000, title: '精英配送员' },
    { threshold: 20000, title: '物流专家' },
    { threshold: 35000, title: '物流大师' },
    { threshold: 50000, title: '传奇车队长' },
    { threshold: 100000, title: '物流之神' },
  ];

  let currentLevel = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (score >= levels[i].threshold) {
      currentLevel = i;
      break;
    }
  }

  const currentThreshold = levels[currentLevel].threshold;
  const nextThreshold = levels[currentLevel + 1]?.threshold || levels[currentLevel].threshold * 2;
  const progress = ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return {
    level: currentLevel + 1,
    progress: Math.min(100, Math.max(0, progress)),
    title: levels[currentLevel].title
  };
};

// 成就面板Props
interface AchievementPanelProps {
  statistics: Statistics;
}

// 成就通知组件
const AchievementNotification: React.FC<{
  achievement: Achievement;
  onClose: () => void;
}> = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const tierColors = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    diamond: 'from-cyan-400 to-blue-500',
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-slideIn">
      <div className={`bg-gradient-to-r ${tierColors[achievement.tier]} p-1 rounded-xl shadow-2xl`}>
        <div className="bg-gray-900 p-4 rounded-lg flex items-center gap-4">
          <div className="text-4xl animate-bounce">{achievement.icon}</div>
          <div>
            <div className="text-xs text-yellow-400 font-medium">🎉 成就解锁！</div>
            <div className="text-white font-bold">{achievement.title}</div>
            <div className="text-gray-400 text-sm">{achievement.description}</div>
            <div className="text-yellow-400 text-sm mt-1">+{achievement.reward} 积分</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 成就面板
export const AchievementPanel: React.FC<AchievementPanelProps> = ({ statistics }) => {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 检查成就解锁
  useEffect(() => {
    ACHIEVEMENTS.forEach(achievement => {
      if (!unlockedIds.has(achievement.id) && achievement.condition(statistics)) {
        setUnlockedIds(prev => new Set([...prev, achievement.id]));
        setNewAchievement(achievement);
      }
    });
  }, [statistics, unlockedIds]);

  const levelInfo = calculateLevel(statistics.totalScore);
  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).length;

  const tierOrder = { diamond: 0, gold: 1, silver: 2, bronze: 3 };
  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return (
    <>
      {/* 成就通知 */}
      {newAchievement && (
        <AchievementNotification 
          achievement={newAchievement} 
          onClose={() => setNewAchievement(null)} 
        />
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        {/* 等级显示 */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900">
                {levelInfo.level}
              </div>
              <div>
                <div className="text-yellow-400 font-bold">{levelInfo.title}</div>
                <div className="text-purple-300 text-sm">Lv.{levelInfo.level}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                {statistics.totalScore.toFixed(0)}
              </div>
              <div className="text-purple-300 text-xs">总积分</div>
            </div>
          </div>
          
          {/* 经验条 */}
          <div className="relative h-3 bg-purple-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
              style={{ width: `${levelInfo.progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
              {levelInfo.progress.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* 成就头部 */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span className="text-xl">🏅</span>
            成就系统
          </h3>
          <span className="text-sm text-gray-400">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        {/* 成就列表 */}
        <div className="p-3 max-h-[250px] overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {(showAll ? sortedAchievements : sortedAchievements.slice(0, 8)).map(achievement => {
              const isUnlocked = unlockedIds.has(achievement.id);
              const tierBg = {
                bronze: 'from-amber-700/30 to-amber-900/30 border-amber-700',
                silver: 'from-gray-400/30 to-gray-600/30 border-gray-500',
                gold: 'from-yellow-400/30 to-yellow-600/30 border-yellow-500',
                diamond: 'from-cyan-400/30 to-blue-500/30 border-cyan-400',
              };

              return (
                <div
                  key={achievement.id}
                  className={`relative p-2 rounded-lg border transition-all cursor-pointer group ${
                    isUnlocked 
                      ? `bg-gradient-to-br ${tierBg[achievement.tier]}` 
                      : 'bg-gray-800/50 border-gray-700 opacity-50'
                  }`}
                  title={`${achievement.title}\n${achievement.description}\n奖励: ${achievement.reward}分`}
                >
                  <div className={`text-2xl text-center ${isUnlocked ? '' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div className={`text-xs text-center mt-1 truncate ${
                    isUnlocked ? 'text-white' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap">
                      <div className="font-bold">{achievement.title}</div>
                      <div className="text-gray-400">{achievement.description}</div>
                      <div className="text-yellow-400">+{achievement.reward} 积分</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {ACHIEVEMENTS.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {showAll ? '收起 ▲' : `显示全部 (${ACHIEVEMENTS.length}) ▼`}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// 得分动画组件
export const ScorePopup: React.FC<{
  score: number;
  x: number;
  y: number;
  onComplete: () => void;
}> = ({ score, x, y, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed pointer-events-none z-50 animate-scoreFloat"
      style={{ left: x, top: y }}
    >
      <span className={`text-2xl font-bold ${score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {score >= 0 ? '+' : ''}{score.toFixed(0)}
      </span>
    </div>
  );
};

// 连击计数器
export const ComboCounter: React.FC<{
  combo: number;
  lastDeliveryTime: number;
}> = ({ combo, lastDeliveryTime }) => {
  const [showUntil, setShowUntil] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);

  useEffect(() => {
    if (combo >= 2) {
      setCurrentCombo(combo);
      setShowUntil(Date.now() + 3000);
      const timer = setTimeout(() => setShowUntil(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [combo, lastDeliveryTime]);

  // 检查是否应该显示
  if (currentCombo < 2 || showUntil === 0) return null;

  const comboColors = [
    'text-white',
    'text-yellow-400',
    'text-orange-400',
    'text-red-400',
    'text-purple-400',
    'text-cyan-400',
  ];

  const colorIndex = Math.min(currentCombo - 2, comboColors.length - 1);

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 animate-comboPulse">
      <div className="text-center">
        <div className={`text-6xl font-black ${comboColors[colorIndex]}`}>
          x{currentCombo}
        </div>
        <div className="text-xl text-yellow-400 font-bold">COMBO!</div>
      </div>
    </div>
  );
};

// 进度环组件
export const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}> = ({ progress, size = 80, strokeWidth = 6, color = '#3B82F6', children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// 迷你地图组件
export const MiniMap: React.FC<{
  vehiclePositions: { x: number; y: number; color: string }[];
  taskPositions: { x: number; y: number; priority: string }[];
  mapSize: number;
}> = ({ vehiclePositions, taskPositions, mapSize }) => {
  const scale = 100 / mapSize;

  return (
    <div className="w-24 h-24 bg-gray-800 rounded-lg border border-gray-600 relative overflow-hidden">
      {/* 任务点 */}
      {taskPositions.map((task, i) => (
        <div
          key={`task-${i}`}
          className="absolute w-2 h-2 rounded-full bg-yellow-500"
          style={{
            left: `${task.x * scale}%`,
            top: `${task.y * scale}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {/* 车辆点 */}
      {vehiclePositions.map((vehicle, i) => (
        <div
          key={`vehicle-${i}`}
          className="absolute w-3 h-3 rounded-full animate-pulse"
          style={{
            left: `${vehicle.x * scale}%`,
            top: `${vehicle.y * scale}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: vehicle.color,
          }}
        />
      ))}
      {/* 中心点（仓库） */}
      <div className="absolute w-3 h-3 bg-blue-500 rounded-sm left-[10%] top-[50%] transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
};

export default AchievementPanel;
