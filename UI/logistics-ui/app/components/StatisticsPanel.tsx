'use client';

import React, { useMemo } from 'react';
import { Statistics, SimulationEvent } from '../types';

interface StatisticsPanelProps {
  statistics: Statistics;
  events: SimulationEvent[];
  currentTime: number;
  maxTime: number;
}

// 格式化时间
const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// 获取事件类型信息
const getEventTypeInfo = (type: SimulationEvent['type']) => {
  switch (type) {
    case 'task_created':
      return { icon: '📦', color: 'text-yellow-400' };
    case 'task_assigned':
      return { icon: '📋', color: 'text-blue-400' };
    case 'task_completed':
      return { icon: '✅', color: 'text-green-400' };
    case 'task_failed':
      return { icon: '❌', color: 'text-red-400' };
    case 'vehicle_departed':
      return { icon: '🚚', color: 'text-purple-400' };
    case 'vehicle_arrived':
      return { icon: '🏁', color: 'text-cyan-400' };
    case 'vehicle_charging':
      return { icon: '⚡', color: 'text-yellow-400' };
    case 'vehicle_charged':
      return { icon: '🔋', color: 'text-green-400' };
    case 'strategy_changed':
      return { icon: '🔄', color: 'text-orange-400' };
    default:
      return { icon: '📝', color: 'text-gray-400' };
  }
};

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  events,
  currentTime,
  maxTime
}) => {
  // 计算进度
  const progress = (currentTime / maxTime) * 100;

  // 最近的事件
  const recentEvents = useMemo(() => {
    return events.slice(-20).reverse();
  }, [events]);

  // 统计卡片数据
  const statCards = [
    {
      title: '总收益',
      value: statistics.totalScore.toFixed(0),
      icon: '💰',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-900/20'
    },
    {
      title: '完成任务',
      value: `${statistics.completedTasks}/${statistics.totalTasks}`,
      icon: '✅',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-900/20'
    },
    {
      title: '准时率',
      value: `${statistics.onTimeRate.toFixed(1)}%`,
      icon: '⏱️',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-900/20'
    },
    {
      title: '总距离',
      value: `${statistics.totalDistance.toFixed(1)} km`,
      icon: '🛣️',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-900/20'
    },
  ];

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">📊</span>
          统计数据
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* 时间进度 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">模拟进度</span>
            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(maxTime)}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${card.bgColor} border border-gray-700`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{card.icon}</span>
                <span className="text-xs text-gray-400">{card.title}</span>
              </div>
              <div className={`text-xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* 详细统计 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded">
            <span className="text-gray-400">失败任务</span>
            <span className="text-red-400 font-medium">{statistics.failedTasks}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded">
            <span className="text-gray-400">待处理</span>
            <span className="text-yellow-400 font-medium">{statistics.pendingTasks}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded">
            <span className="text-gray-400">车辆利用率</span>
            <span className="text-blue-400 font-medium">{statistics.vehicleUtilization.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded">
            <span className="text-gray-400">平均配送时间</span>
            <span className="text-purple-400 font-medium">{statistics.averageDeliveryTime.toFixed(1)}分</span>
          </div>
        </div>

        {/* 效率分析 */}
        <div className="p-3 bg-gray-800 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-2">效率分析</h4>
          <div className="space-y-2">
            {/* 任务完成率 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">任务完成率</span>
                <span className="text-white">
                  {statistics.totalTasks > 0 
                    ? ((statistics.completedTasks / statistics.totalTasks) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ 
                    width: `${statistics.totalTasks > 0 
                      ? (statistics.completedTasks / statistics.totalTasks) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* 车辆利用率 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">车辆利用率</span>
                <span className="text-white">{statistics.vehicleUtilization.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${statistics.vehicleUtilization}%` }}
                />
              </div>
            </div>

            {/* 充电站利用率 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">充电站利用率</span>
                <span className="text-white">{statistics.chargingStationUtilization.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${statistics.chargingStationUtilization}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 事件日志 */}
        <div>
          <h4 className="text-sm text-gray-400 mb-2">事件日志</h4>
          <div className="max-h-[200px] overflow-y-auto bg-gray-800 rounded-lg">
            {recentEvents.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                暂无事件
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {recentEvents.map(event => {
                  const typeInfo = getEventTypeInfo(event.type);
                  return (
                    <div key={event.id} className="px-3 py-2 text-xs flex items-start gap-2">
                      <span className="text-gray-500 shrink-0 w-12">
                        {formatTime(event.time)}
                      </span>
                      <span className={typeInfo.color}>{typeInfo.icon}</span>
                      <span className="text-gray-300">{event.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
