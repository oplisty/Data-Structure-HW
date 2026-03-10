'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';

interface TaskPanelProps {
  tasks: Task[];
  currentTime: number;
  onTaskClick?: (taskId: string) => void;
}

// 获取状态信息
const getStatusInfo = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return { text: '待分配', color: 'bg-yellow-500', icon: '⏳' };
    case 'assigned':
      return { text: '已分配', color: 'bg-blue-500', icon: '📋' };
    case 'in_progress':
      return { text: '配送中', color: 'bg-purple-500', icon: '🚚' };
    case 'completed':
      return { text: '已完成', color: 'bg-green-500', icon: '✓' };
    case 'failed':
      return { text: '失败', color: 'bg-red-500', icon: '✗' };
    case 'expired':
      return { text: '已超时', color: 'bg-gray-500', icon: '⌛' };
    default:
      return { text: '未知', color: 'bg-gray-500', icon: '?' };
  }
};

// 获取优先级信息
const getPriorityInfo = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return { text: '紧急', color: 'text-red-400', bgColor: 'bg-red-900/30' };
    case 'high':
      return { text: '高', color: 'text-orange-400', bgColor: 'bg-orange-900/30' };
    case 'medium':
      return { text: '中', color: 'text-blue-400', bgColor: 'bg-blue-900/30' };
    case 'low':
      return { text: '低', color: 'text-green-400', bgColor: 'bg-green-900/30' };
    default:
      return { text: '未知', color: 'text-gray-400', bgColor: 'bg-gray-900/30' };
  }
};

// 格式化时间
const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// 任务过滤选项
type FilterOption = 'all' | 'pending' | 'active' | 'completed' | 'failed';

const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  currentTime,
  onTaskClick
}) => {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending':
        return task.status === 'pending';
      case 'active':
        return task.status === 'assigned' || task.status === 'in_progress';
      case 'completed':
        return task.status === 'completed';
      case 'failed':
        return task.status === 'failed' || task.status === 'expired';
      default:
        return true;
    }
  }).slice().reverse(); // 最新任务在前

  // 统计数据
  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    active: tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed' || t.status === 'expired').length,
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">📦</span>
          配送任务
          <span className="ml-auto text-sm font-normal text-gray-400">
            共 {tasks.length} 个任务
          </span>
        </h3>
      </div>

      {/* 过滤标签 */}
      <div className="px-3 py-2 border-b border-gray-800 flex gap-1 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          全部 ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          待分配 ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          进行中 ({stats.active})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
            filter === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          已完成 ({stats.completed})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
            filter === 'failed'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          失败 ({stats.failed})
        </button>
      </div>

      {/* 任务列表 */}
      <div className="max-h-[350px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无相关任务
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredTasks.map(task => {
              const statusInfo = getStatusInfo(task.status);
              const priorityInfo = getPriorityInfo(task.priority);
              const timeLeft = task.deadline - currentTime;
              const isUrgent = timeLeft < 10 && task.status === 'pending';
              const isExpanded = expandedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`p-3 transition-all hover:bg-gray-800 cursor-pointer ${
                    isUrgent ? 'bg-red-900/20' : ''
                  }`}
                  onClick={() => {
                    setExpandedTaskId(isExpanded ? null : task.id);
                    onTaskClick?.(task.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* 优先级指示 */}
                    <div className={`w-1 h-12 rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-500' :
                      task.priority === 'high' ? 'bg-orange-500' :
                      task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />

                    <div className="flex-1 min-w-0">
                      {/* 任务头部 */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">
                          {task.id}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                          {priorityInfo.text}
                        </span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${statusInfo.color} text-white`}>
                          {statusInfo.icon} {statusInfo.text}
                        </span>
                      </div>

                      {/* 任务信息 */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>重量: <span className="text-white">{task.weight}kg</span></span>
                        <span>奖励: <span className="text-yellow-400">{task.reward.toFixed(0)}</span></span>
                        
                        {task.status === 'pending' || task.status === 'assigned' || task.status === 'in_progress' ? (
                          <span className={timeLeft < 10 ? 'text-red-400' : ''}>
                            剩余: <span className={timeLeft < 10 ? 'text-red-400 font-medium' : 'text-white'}>
                              {timeLeft > 0 ? `${timeLeft.toFixed(0)}分钟` : '已超时'}
                            </span>
                          </span>
                        ) : task.status === 'completed' && task.completedTime ? (
                          <span>
                            用时: <span className="text-green-400">
                              {(task.completedTime - task.createTime).toFixed(0)}分钟
                            </span>
                          </span>
                        ) : null}
                      </div>

                      {/* 展开详情 */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs grid grid-cols-2 gap-2">
                          <div className="text-gray-400">
                            创建时间: <span className="text-white">{formatTime(task.createTime)}</span>
                          </div>
                          <div className="text-gray-400">
                            截止时间: <span className={timeLeft < 10 ? 'text-red-400' : 'text-white'}>
                              {formatTime(task.deadline)}
                            </span>
                          </div>
                          {task.assignedVehicleId && (
                            <div className="col-span-2 text-gray-400">
                              分配车辆: <span className="text-blue-400">{task.assignedVehicleId}</span>
                            </div>
                          )}
                          <div className="col-span-2 text-gray-400">
                            位置: <span className="text-white">
                              ({task.position.x.toFixed(0)}, {task.position.y.toFixed(0)})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 展开指示器 */}
                    <div className="text-gray-500 text-xs">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 统计底栏 */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            完成率: 
            <span className="text-green-400 ml-1 font-medium">
              {tasks.length > 0 
                ? ((stats.completed / tasks.length) * 100).toFixed(1) 
                : 0}%
            </span>
          </span>
          <span className="text-gray-400">
            总奖励: 
            <span className="text-yellow-400 ml-1 font-medium">
              {tasks.filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + t.reward, 0).toFixed(0)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskPanel;
