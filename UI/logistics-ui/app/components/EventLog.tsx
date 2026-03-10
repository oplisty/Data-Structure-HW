'use client';

import React from 'react';
import { SimulationEvent } from '../types';

interface EventLogProps {
  events: SimulationEvent[];
  maxHeight?: string;
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
      return { icon: '📦', color: 'border-yellow-500', bg: 'bg-yellow-900/20', text: 'text-yellow-400' };
    case 'task_assigned':
      return { icon: '📋', color: 'border-blue-500', bg: 'bg-blue-900/20', text: 'text-blue-400' };
    case 'task_completed':
      return { icon: '✅', color: 'border-green-500', bg: 'bg-green-900/20', text: 'text-green-400' };
    case 'task_failed':
      return { icon: '❌', color: 'border-red-500', bg: 'bg-red-900/20', text: 'text-red-400' };
    case 'vehicle_departed':
      return { icon: '🚚', color: 'border-purple-500', bg: 'bg-purple-900/20', text: 'text-purple-400' };
    case 'vehicle_arrived':
      return { icon: '🏁', color: 'border-cyan-500', bg: 'bg-cyan-900/20', text: 'text-cyan-400' };
    case 'vehicle_charging':
      return { icon: '⚡', color: 'border-yellow-500', bg: 'bg-yellow-900/20', text: 'text-yellow-400' };
    case 'vehicle_charged':
      return { icon: '🔋', color: 'border-green-500', bg: 'bg-green-900/20', text: 'text-green-400' };
    case 'collaboration_started':
      return { icon: '🤝', color: 'border-pink-500', bg: 'bg-pink-900/20', text: 'text-pink-400' };
    case 'strategy_changed':
      return { icon: '🔄', color: 'border-orange-500', bg: 'bg-orange-900/20', text: 'text-orange-400' };
    default:
      return { icon: '📝', color: 'border-gray-500', bg: 'bg-gray-900/20', text: 'text-gray-400' };
  }
};

const EventLog: React.FC<EventLogProps> = ({
  events,
  maxHeight = '400px'
}) => {
  // 获取最近的事件（倒序）
  const recentEvents = [...events].reverse().slice(0, 50);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">📜</span>
          事件日志
          <span className="ml-auto text-sm font-normal text-gray-400">
            最近 {recentEvents.length} 条
          </span>
        </h3>
      </div>

      <div style={{ maxHeight }} className="overflow-y-auto">
        {recentEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>暂无事件</p>
          </div>
        ) : (
          <div className="p-2">
            {recentEvents.map((event, index) => {
              const typeInfo = getEventTypeInfo(event.type);
              
              return (
                <div
                  key={event.id}
                  className={`p-3 mb-2 rounded-lg border-l-4 ${typeInfo.color} ${typeInfo.bg} animate-fadeIn`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{typeInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-xs font-medium ${typeInfo.text}`}>
                          {event.type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {formatTime(event.time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{event.message}</p>
                      
                      {event.details && Object.keys(event.details).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(event.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: <span className="text-gray-400">{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLog;
