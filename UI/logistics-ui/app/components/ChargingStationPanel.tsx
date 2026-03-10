'use client';

import React from 'react';
import { ChargingStation, Vehicle } from '../types';

interface ChargingStationPanelProps {
  stations: ChargingStation[];
  vehicles: Vehicle[];
  onStationClick?: (stationId: string) => void;
}

// 获取负荷颜色
const getLoadColor = (load: number) => {
  if (load < 50) return 'bg-green-500';
  if (load < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

// 获取负荷等级文本
const getLoadLevel = (load: number) => {
  if (load < 50) return { text: '空闲', color: 'text-green-400' };
  if (load < 80) return { text: '中等', color: 'text-yellow-400' };
  return { text: '繁忙', color: 'text-red-400' };
};

const ChargingStationPanel: React.FC<ChargingStationPanelProps> = ({
  stations,
  vehicles,
  onStationClick
}) => {
  // 获取车辆名称
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.name || vehicleId;
  };

  // 计算总体统计
  const totalCapacity = stations.reduce((sum, s) => sum + s.capacity, 0);
  const totalCharging = stations.reduce((sum, s) => sum + s.chargingVehicles.length, 0);
  const totalWaiting = stations.reduce((sum, s) => sum + s.currentQueue.length, 0);
  const averageLoad = totalCapacity > 0 ? (totalCharging / totalCapacity) * 100 : 0;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          充电站
          <span className="ml-auto text-sm font-normal text-gray-400">
            {stations.length} 个站点
          </span>
        </h3>
      </div>

      {/* 总体概览 */}
      <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="text-gray-500">充电桩</div>
            <div className="text-white font-medium">{totalCapacity}</div>
          </div>
          <div>
            <div className="text-gray-500">使用中</div>
            <div className="text-green-400 font-medium">{totalCharging}</div>
          </div>
          <div>
            <div className="text-gray-500">排队中</div>
            <div className="text-yellow-400 font-medium">{totalWaiting}</div>
          </div>
          <div>
            <div className="text-gray-500">平均负荷</div>
            <div className={`font-medium ${getLoadLevel(averageLoad).color}`}>
              {averageLoad.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* 充电站列表 */}
      <div className="max-h-[300px] overflow-y-auto">
        <div className="divide-y divide-gray-800">
          {stations.map(station => {
            const usagePercent = (station.chargingVehicles.length / station.capacity) * 100;
            const loadLevel = getLoadLevel(usagePercent);

            return (
              <div
                key={station.id}
                onClick={() => onStationClick?.(station.id)}
                className="p-3 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* 充电站图标 */}
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white">
                    ⚡
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 站点名称和状态 */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">
                        {station.name}
                      </span>
                      <span className={`text-xs ${loadLevel.color}`}>
                        {loadLevel.text}
                      </span>
                    </div>

                    {/* 使用率条 */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getLoadColor(usagePercent)}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-12 text-right">
                        {station.chargingVehicles.length}/{station.capacity}
                      </span>
                    </div>

                    {/* 排队信息 */}
                    {station.currentQueue.length > 0 && (
                      <div className="text-xs text-yellow-400">
                        🕐 排队等待: {station.currentQueue.length} 辆
                      </div>
                    )}
                  </div>
                </div>

                {/* 详细信息 */}
                <div className="mt-2 ml-13 text-xs">
                  {/* 正在充电的车辆 */}
                  {station.chargingVehicles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      <span className="text-gray-500">充电中:</span>
                      {station.chargingVehicles.map(vehicleId => {
                        const vehicle = vehicles.find(v => v.id === vehicleId);
                        return (
                          <span
                            key={vehicleId}
                            className="px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded text-xs"
                            style={{ borderLeft: `3px solid ${vehicle?.color || '#10B981'}` }}
                          >
                            {getVehicleName(vehicleId)}
                            {vehicle && ` (${vehicle.battery.toFixed(0)}%)`}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 排队的车辆 */}
                  {station.currentQueue.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-gray-500">排队:</span>
                      {station.currentQueue.map((vehicleId, index) => (
                        <span
                          key={vehicleId}
                          className="px-1.5 py-0.5 bg-yellow-900/50 text-yellow-400 rounded text-xs"
                        >
                          #{index + 1} {getVehicleName(vehicleId)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 充电速度信息 */}
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 ml-13">
                  <span>充电速度: {station.chargingSpeed}%/分钟</span>
                  <span>位置: ({station.position.x.toFixed(0)}, {station.position.y.toFixed(0)})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 负荷警告 */}
      {averageLoad > 80 && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 text-xs text-red-400 flex items-center gap-2">
          <span>⚠️</span>
          <span>充电站负荷过高，建议调整调度策略或增加充电站</span>
        </div>
      )}
    </div>
  );
};

export default ChargingStationPanel;
