'use client';

import React from 'react';
import { Vehicle } from '../types';

interface VehiclePanelProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onSelectVehicle?: (vehicleId: string) => void;
}

// 获取状态显示文本和颜色
const getStatusInfo = (status: Vehicle['status']) => {
  switch (status) {
    case 'idle':
      return { text: '空闲', color: 'bg-gray-500', textColor: 'text-gray-400' };
    case 'delivering':
      return { text: '配送中', color: 'bg-blue-500', textColor: 'text-blue-400' };
    case 'charging':
      return { text: '充电中', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    case 'returning':
      return { text: '返程中', color: 'bg-purple-500', textColor: 'text-purple-400' };
    case 'waiting':
      return { text: '等待充电', color: 'bg-orange-500', textColor: 'text-orange-400' };
    default:
      return { text: '未知', color: 'bg-gray-500', textColor: 'text-gray-400' };
  }
};

// 电量条颜色
const getBatteryColor = (battery: number) => {
  if (battery < 20) return 'bg-red-500';
  if (battery < 50) return 'bg-yellow-500';
  return 'bg-green-500';
};

const VehiclePanel: React.FC<VehiclePanelProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle
}) => {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🚚</span>
          车队状态
          <span className="ml-auto text-sm font-normal text-gray-400">
            {vehicles.length} 辆车
          </span>
        </h3>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        <div className="divide-y divide-gray-800">
          {vehicles.map(vehicle => {
            const statusInfo = getStatusInfo(vehicle.status);
            const isSelected = selectedVehicleId === vehicle.id;

            return (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle?.(vehicle.id)}
                className={`p-3 cursor-pointer transition-all hover:bg-gray-800 ${
                  isSelected ? 'bg-gray-800 ring-1 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 车辆图标和颜色 */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: vehicle.color }}
                  >
                    {parseInt(vehicle.id.split('_')[1]) + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 车辆名称和状态 */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium truncate">
                        {vehicle.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color} text-white`}>
                        {statusInfo.text}
                      </span>
                    </div>

                    {/* 电量条 */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 w-8">电量</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getBatteryColor(vehicle.battery)}`}
                          style={{ width: `${vehicle.battery}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-10 text-right">
                        {vehicle.battery.toFixed(0)}%
                      </span>
                    </div>

                    {/* 载重条 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">载重</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${(vehicle.currentLoad / vehicle.maxLoad) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-10 text-right">
                        {vehicle.currentLoad}/{vehicle.maxLoad}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 展开详情（选中时显示） */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-400">
                      速度：<span className="text-white">{vehicle.speed} km/h</span>
                    </div>
                    <div className="text-gray-400">
                      最大载重：<span className="text-white">{vehicle.maxLoad} kg</span>
                    </div>
                    <div className="text-gray-400">
                      已完成任务：<span className="text-green-400">{vehicle.completedTasks}</span>
                    </div>
                    <div className="text-gray-400">
                      总行驶：<span className="text-white">{vehicle.totalDistance.toFixed(1)} km</span>
                    </div>
                    {vehicle.assignedTasks.length > 0 && (
                      <div className="col-span-2 text-gray-400">
                        当前任务：<span className="text-blue-400">{vehicle.assignedTasks.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 统计摘要 */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="text-gray-500">空闲</div>
            <div className="text-gray-300 font-medium">
              {vehicles.filter(v => v.status === 'idle').length}
            </div>
          </div>
          <div>
            <div className="text-blue-500">配送</div>
            <div className="text-blue-300 font-medium">
              {vehicles.filter(v => v.status === 'delivering').length}
            </div>
          </div>
          <div>
            <div className="text-yellow-500">充电</div>
            <div className="text-yellow-300 font-medium">
              {vehicles.filter(v => v.status === 'charging' || v.status === 'waiting').length}
            </div>
          </div>
          <div>
            <div className="text-purple-500">返程</div>
            <div className="text-purple-300 font-medium">
              {vehicles.filter(v => v.status === 'returning').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclePanel;
